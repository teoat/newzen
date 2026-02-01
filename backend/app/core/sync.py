import logging
from typing import List, Dict
from fastapi import (
    APIRouter, WebSocket, WebSocketDisconnect, Query, Depends, status
)
from jose import jwt, JWTError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import get_session
from app.models import UserProjectAccess

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Map project_id -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Track global connections
        self.global_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, project_id: str = None):
        await websocket.accept()
        if project_id:
            if project_id not in self.active_connections:
                self.active_connections[project_id] = []
            self.active_connections[project_id].append(websocket)
            logger.info(f"Client connected to project channel: {project_id}")
        else:
            self.global_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: str = None):
        if project_id and project_id in self.active_connections:
            if websocket in self.active_connections[project_id]:
                self.active_connections[project_id].remove(websocket)
                if not self.active_connections[project_id]:
                    del self.active_connections[project_id]
        elif websocket in self.global_connections:
            self.global_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: dict, project_id: str = None):
        """Broadcast to specific project room or globally."""
        if project_id:
            if project_id in self.active_connections:
                for connection in self.active_connections[project_id]:
                    await connection.send_json(message)
        else:
            # Broadcast to everyone
            for connection in self.global_connections:
                await connection.send_json(message)
            for connections in self.active_connections.values():
                for connection in connections:
                    await connection.send_json(message)


manager = ConnectionManager()
router = APIRouter(tags=["Realtime"])


@router.websocket("/ws/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: str,
    token: str = Query(...),
    db: Session = Depends(get_session)
):
    """
    Secure WebSocket Endpoint for Project Realtime Updates.
    Requires valid JWT token and Project Access.
    """
    # 1. Security Handshake
    try:
        # Decode Token
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            logger.warning(
                f"WS Auth Failed: No user_id in token for {project_id}"
            )
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        # Verify Project Access
        access = db.exec(
            select(UserProjectAccess)
            .where(UserProjectAccess.user_id == user_id)
            .where(UserProjectAccess.project_id == project_id)
        ).first()

        if not access:
            logger.warning(
                f"WS Auth Failed: User {user_id} denied access to {project_id}"
            )
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    except JWTError as e:
        logger.warning(f"WS Auth Failed: Invalid Token - {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    except Exception as e:
        logger.error(f"WS Auth Error: {e}")
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    # 2. Connection Established
    await manager.connect(websocket, project_id)

    # Broadcast join event
    await manager.broadcast(
        {
            "type": "PRESENCE",
            "event": "JOIN",
            "project_id": project_id,
            "user_id": user_id
        },
        project_id
    )

    try:
        while True:
            # Keep line open
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        # Broadcast leave event
        await manager.broadcast(
            {
                "type": "PRESENCE",
                "event": "LEAVE",
                "project_id": project_id,
                "user_id": user_id
            },
            project_id
        )

@router.websocket("/ws/global/activity")
async def global_activity_websocket(websocket: WebSocket):
    """
    Real-time feed of all critical forensic activity across projects.
    """
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
