"""
Forensic Services V2 API Router.
Exposes NetworkService, AnalyticsService, VisionService, and v3.0 agents.
"""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.core.db import get_session
from app.modules.forensic.network_service import NetworkService
from app.modules.forensic.analytics_service import AnalyticsService
from app.modules.forensic.ingestion_service import IngestionService
from app.modules.forensic.vision_service import VisionService
from app.modules.forensic.rab_service import RABService
from app.modules.forensic.rab_service_v2 import RABServiceV2
from app.modules.forensic.site_truth_service import SiteTruthService
from app.services.intelligence.judge_service import JudgeService
from app.services.intelligence.prophet_service import ProphetService

router = APIRouter(prefix="/forensic-v2", tags=["Forensic Services V2"])


# ============================================================================
# Phase 2: Data Services
# ============================================================================

@router.get("/analytics/dashboard/{project_id}")
async def get_analytics_dashboard(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Get comprehensive project analytics with RAB integration.
    Returns financial metrics, leakage estimates, and variance data.
    """
    service = AnalyticsService(db)
    return service.get_project_dashboard(project_id)


@router.get("/analytics/s-curve/{project_id}")
async def get_s_curve(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Generate S-Curve data comparing planned vs actual spend.
    """
    service = AnalyticsService(db)
    return service.get_s_curve_data(project_id)


@router.get("/analytics/high-risk-transactions/{project_id}")
async def get_high_risk_transactions(
    project_id: str,
    limit: int = 50,
    db: Session = Depends(get_session)
):
    """
    Fetch transactions with forensic flags.
    """
    service = AnalyticsService(db)
    return service.get_high_risk_transactions(project_id, limit)


@router.get("/analytics/entity-profile/{entity_id}")
async def get_entity_profile(
    entity_id: str,
    db: Session = Depends(get_session)
):
    """
    Get risk profile and transaction stats for an entity.
    """
    service = AnalyticsService(db)
    return service.get_entity_risk_profile(entity_id)


@router.get("/graph/neighborhood/{entity_id}")
async def get_graph_neighborhood(
    entity_id: str,
    depth: int = 2,
    db: Session = Depends(get_session)
):
    """
    Get graph neighborhood with BFS traversal.
    Returns nodes and links with pre-calculated positions.
    """
    service = NetworkService(db)
    return service.get_neighborhood(entity_id, depth)


@router.get("/graph/circular-flows/{project_id}")
async def get_circular_flows(
    project_id: str,
    max_hops: int = 4,
    db: Session = Depends(get_session)
):
    """
    Detect suspicious money loops (Money Laundering Typology).
    finds A -> B -> C -> A patterns.
    """
    service = NetworkService(db)
    return service.detect_circular_flows(project_id, max_hops)


# ============================================================================
# Ingestion Services
# ============================================================================

class SchemaMapRequest(BaseModel):
    file_columns: List[str]
    sample_data: List[Dict[str, Any]]
    target_schema: List[Dict[str, str]]


@router.post("/ingestion/infer-schema")
async def infer_schema_mapping(
    request: SchemaMapRequest,
    db: Session = Depends(get_session)
):
    """
    Use LLM to intelligently map file columns to target schema.
    """
    service = IngestionService(db)
    mapping = await service.infer_schema_mapping(
        request.file_columns,
        request.sample_data,
        request.target_schema
    )
    return {"mapping": mapping}


class DataQualityRequest(BaseModel):
    records: List[Dict[str, Any]]


@router.post("/ingestion/validate-quality")
async def validate_data_quality(
    request: DataQualityRequest,
    db: Session = Depends(get_session)
):
    """
    AI-powered data quality validation.
    """
    service = IngestionService(db)
    result = await service.validate_data_quality(request.records)
    return result


@router.get("/site-truth/geospatial-verify/{project_id}")
async def verify_site_geospatial(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Automated Site-Truth Verification.
    Cross-references photo GPS metadata with transaction logs.
    """
    service = SiteTruthService(db)
    return service.verify_project_geospatial_integrity(project_id)


# ============================================================================
# Phase 3: Vision Services
# ============================================================================

@router.post("/vision/analyze-invoice")
async def analyze_invoice(
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    """
    Extract structured data from invoice/receipt images using OCR.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    # Save temporarily
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    service = VisionService(db)
    result = await service.analyze_invoice(temp_path)
    return result


@router.post("/vision/count-objects")
async def count_objects_in_photo(
    file: UploadFile = File(...),
    object_type: str = "excavator",
    db: Session = Depends(get_session)
):
    """
    Count specific objects in construction site photos.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    service = VisionService(db)
    result = await service.count_objects_in_site_photo(temp_path, object_type)
    return result


@router.post("/vision/detect-manipulation")
async def detect_photo_manipulation(
    file: UploadFile = File(...),
    db: Session = Depends(get_session)
):
    """
    Forensic analysis for photo editing/forgery.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    service = VisionService(db)
    result = await service.detect_photo_manipulation(temp_path)
    return result


# ============================================================================
# Phase 4: v3.0 Agent Services
# ============================================================================

@router.post("/judge/generate-dossier")
async def generate_dossier(
    case_id: str,
    user_id: str,
    db: Session = Depends(get_session)
):
    """
    Generate comprehensive legal brief with chain of custody.
    """
    service = JudgeService(db)
    result = await service.generate_court_dossier(case_id, user_id)
    return result


@router.get("/judge/download-dossier")
async def download_dossier(
    case_id: str,
    user_id: str,
    db: Session = Depends(get_session)
):
    """
    Download high-fidelity PDF dossier for court submission.
    """
    service = JudgeService(db)
    try:
        pdf_buffer = await service.generate_pdf_dossier(case_id, user_id)
        filename = f"Zenith_Dossier_{case_id}_{user_id}.pdf"
        
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class LegalDocRequest(BaseModel):
    case_id: str
    document_type: str  # 'subpoena', 'freeze_order', 'audit_finding'
    template_vars: Optional[Dict[str, Any]] = None


@router.post("/judge/draft-document")
async def draft_legal_document(
    request: LegalDocRequest,
    db: Session = Depends(get_session)
):
    """
    Generate legal documents from templates.
    """
    service = JudgeService(db)
    document = await service.draft_legal_document(
        request.case_id,
        request.document_type,
        request.template_vars
    )
    return {"document_text": document}


class TransactionRiskRequest(BaseModel):
    transaction_data: Dict[str, Any]


@router.post("/prophet/predict-risk")
async def predict_transaction_risk(
    request: TransactionRiskRequest,
    db: Session = Depends(get_session)
):
    """
    Real-time risk prediction for transaction interception.
    V2: Weighted Scoring Model.
    """
    from app.services.intelligence.prophet_service import ProphetService
    service = ProphetService(db)
    result = await service.predict_transaction_risk(
        request.transaction_data
    )
    return result


@router.get("/prophet/forecast-budget/{project_id}")
async def forecast_budget_exhaustion(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Predict when project budget will be exhausted.
    """
    service = ProphetService(db)
    result = service.simulate_budget_exhaustion(project_id)
    return result


class VendorScreenRequest(BaseModel):
    vendor_name: str
    vendor_npwp: Optional[str] = None


@router.post("/prophet/screen-vendor")
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


@router.get("/prophet/velocity-anomalies/{project_id}")
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


# ============================================================================
# RAB (Budget) Integration Services
# ============================================================================

@router.post("/rab/upload")
async def upload_rab(
    file: UploadFile = File(...),
    project_id: str = "",
    db: Session = Depends(get_session)
):
    """
    Upload and parse RAB file (Excel/CSV/PDF).
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    if not project_id:
        raise HTTPException(status_code=400, detail="project_id required")

    # Save temporarily
    temp_path = f"/tmp/{file.filename}"
    with open(temp_path, "wb") as f:
        content = await file.read()
        f.write(content)

    service = RABService(db)
    result = await service.upload_and_parse_rab(temp_path, project_id)
    return result


@router.get("/rab/project/{project_id}")
async def get_project_rab(
    project_id: str,
    category: Optional[str] = None,
    db: Session = Depends(get_session)
):
    """
    Get all budget lines for a project with optional category filter.
    """
    service = RABService(db)
    budget_lines = service.get_project_rab(project_id, category)
    return {
        "project_id": project_id,
        "total_lines": len(budget_lines),
        "budget_lines": budget_lines
    }


@router.post("/rab/variance/{project_id}")
async def get_variance_analysis(
    project_id: str,
    overrides: Optional[Dict[str, Any]] = None,
    db: Session = Depends(get_session)
):
    """
    Get comprehensive variance analysis for budget vs actual.
    Supports ratio overrides via POST body.
    """
    service = RABService(db)
    return await service.get_variance_analysis(project_id, overrides)


@router.post("/rab/recalculate/{project_id}")
async def recalculate_variance(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Recalculate variance for all budget lines (refresh cache).
    v2: Uses batch processing for performance.
    """
    service = RABServiceV2(db)
    result = await service.recalculate_variance_v2(project_id)
    return result


@router.get("/rab/site-truth/{project_id}")
async def get_site_truth(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    RAB-driven Reality Check.
    Mapping CCO Benchmarks against bank mutations.
    """
    from app.modules.forensic.service import SiteTruthValidator
    return SiteTruthValidator.get_site_audit_data(db, project_id)


@router.get("/rab/non-perishable-assets/{project_id}")
async def get_non_perishable_assets(
    project_id: str,
    db: Session = Depends(get_session)
):
    """
    Discovery of non-perishable assets (Equpiment, Gensets, Trucks).
    """
    service = RABService(db)
    return service.calculate_non_perishable_assets(project_id)

