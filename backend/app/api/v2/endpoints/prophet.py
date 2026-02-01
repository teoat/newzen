"""
Prophet Services V2 API Router.
Predictive Forensic Analytics.
"""
from fastapi import APIRouter, Depends
from sqlmodel import Session
from typing import Dict, Any, Optional
from pydantic import BaseModel
from app.core.db import get_session
from app.services.intelligence.prophet_service import ProphetService

router = APIRouter(prefix="/prophet", tags=["The Prophet - Predictive Compliance"])

class TransactionRiskRequest(BaseModel):
    transaction_data: Dict[str, Any]

@router.post("/predict-risk")
async def predict_transaction_risk(
    request: TransactionRiskRequest,
    db: Session = Depends(get_session)
):
    """
    Real-time risk prediction for transaction interception.
    """
    service = ProphetService(db)
    result = await service.predict_transaction_risk(
        request.transaction_data
    )
    return result

@router.get("/forecast-budget/{project_id}")
async def forecast_budget_exhaustion(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Predict when project budget will be exhausted.
    """
    service = ProphetService(db)
    result = await service.forecast_budget_exhaustion(project_id)
    return result

class VendorScreenRequest(BaseModel):
    vendor_name: str
    vendor_npwp: Optional[str] = None

@router.post("/screen-vendor")
async def screen_vendor(
    request: VendorScreenRequest,
    db: Session = Depends(get_session)
):
    """
    Pre-screen vendor against watchlists and historical data.
    """
    service = ProphetService(db)
    result = await service.pre_screen_vendor(
        request.vendor_name,
        request.vendor_npwp
    )
    return result

@router.get("/velocity-anomalies/{project_id}")
async def detect_velocity_anomalies(
    project_id: str,
    window_hours: int = 24,
    db: Session = Depends(get_session)
):
    """
    Detect high-frequency transaction bursts.
    """
    service = ProphetService(db)
    result = service.detect_velocity_anomalies(project_id, window_hours)
    return result
