# Authorization Models - Import at the end of models.py

from app.modules.auth.access_control import UserProjectAccess, ProjectRole

__all__ = [
    # ... existing exports ...
    "UserProjectAccess",
    "ProjectRole",
]
