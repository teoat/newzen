# RAB (Rencana Anggaran Biaya) Integration System Design

**Date:** 2026-01-30  
**Purpose:** Comprehensive budget management and variance analysis for Indonesia construction forensics

---

## 1. Executive Summary

The RAB Integration System enables intelligent upload, parsing, analysis, and real-time variance tracking of construction budgets (Bill of Quantities). It bridges planned budgets with actual expenditures to detect markup fraud, volume manipulation, and cost overruns.

---

## 2. System Architecture

### 2.1 Data Model (Already Implemented)

**Core Model:** `BudgetLine` in `backend/app/models.py`

```python
class BudgetLine(SQLModel, table=True):
    id: str = Field(default_factory=lambda: f"BL-{uuid4().hex[:8]}")
    project_id: str = Field(foreign_key="project.id")
    
    # RAB Fields (Planned)
    item_name: str
    category: str  # "Material", "Labor", "Equipment"
    qty_rab: float  # Planned quantity
    unit: str  # "m3", "ton", "unit"
    unit_price_rab: float  # Planned unit price
    total_price_rab: float  # qty_rab * unit_price_rab
    
    # Actual Fields (From Transactions)
    qty_actual: float
    avg_unit_price_actual: float
    
    # Forensic Analysis
    markup_percentage: float  # (actual - rab) / rab * 100
    volume_discrepancy: float  # qty_actual - qty_rab
    requires_justification: bool
```

### 2.2 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                            │
├─────────────────────────────────────────────────────────────┤
│ • RAB Upload UI (Excel/PDF drag-drop)                       │
│ • Budget Dashboard (charts, variance tables)                │
│ • Variance Alerts (real-time red flags)                     │
│ • S-Curve Visualization (planned vs actual)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    API Layer                                 │
├─────────────────────────────────────────────────────────────┤
│ POST /api/v2/rab/upload         # Upload RAB file           │
│ GET  /api/v2/rab/project/{id}   # Get project RAB           │
│ GET  /api/v2/rab/variance/{id}  # Get variance analysis     │
│ POST /api/v2/rab/recalculate    # Refresh variance metrics  │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│ • RABService (parsing, extraction, variance calculation)    │
│ • AnalyticsService (already integrated)                     │
│ • VisionService (for PDF table extraction)                  │
└─────────────────────────────────────────────────────────────┘
                            ↓↑
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│ • BudgetLine table                                           │
│ • Transaction table (linked via project_id)                 │
│ • Project table (contract metadata)                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Features

### 3.1 RAB Upload & Parsing

#### Supported Formats

1. **Excel (.xlsx, .xls)** - Direct table parsing
2. **PDF** - OCR + table detection via Gemini Vision
3. **CSV** - Raw delimiter parsing

#### Parsing Pipeline

```python
class RABService:
    async def upload_and_parse_rab(
        self,
        file_path: str,
        project_id: str,
        file_type: str
    ) -> Dict[str, Any]:
        """
        1. Detect file type
        2. Extract tables (pandas for Excel, Vision API for PDF)
        3. Infer schema mapping (use IngestionService)
        4. Validate data quality
        5. Bulk insert BudgetLine records
        6. Return summary
        """
```

#### Expected RAB Schema

| Column Name (ID) | Column Name (EN) | Type | Required |
|:-----------------|:-----------------|:-----|:---------|
| No | No | int | No |
| Kode Item / Item Code | Item Code | str | No |
| Nama Pekerjaan / Uraian | Item Name | str | **Yes** |
| Kategori | Category | str | Yes |
| Volume | Quantity | float | **Yes** |
| Satuan | Unit | str | **Yes** |
| Harga Satuan | Unit Price | float | **Yes** |
| Jumlah Harga | Total Price | float | Calculated |

#### AI-Powered Schema Inference

Uses `IngestionService.infer_schema_mapping()` to automatically detect:

- Column names in Indonesian/English
- Numeric formats (1,234,567.89 vs 1.234.567,89)
- Unit variations ("m³" vs "m3" vs "kubik")

---

### 3.2 Variance Analysis Engine

#### Real-Time Variance Calculation

**Triggered on:**

- New RAB upload
- New transaction verification
- Manual recalculation request

**Calculation Logic:**

```python
def calculate_variance(budget_line: BudgetLine) -> Dict[str, Any]:
    """
    For each budget line:
    1. Query all related transactions
    2. Aggregate qty_actual and avg_unit_price_actual
    3. Calculate markup percentage
    4. Calculate volume discrepancy
    5. Flag if requires_justification
    """
    
    # Price Variance
    price_variance_pct = (
        (avg_unit_price_actual - unit_price_rab) / unit_price_rab
    ) * 100
    
    # Volume Variance
    volume_variance_pct = (
        (qty_actual - qty_rab) / qty_rab
    ) * 100
    
    # Total Cost Impact
    total_variance_idr = (
        (qty_actual * avg_unit_price_actual) - 
        (qty_rab * unit_price_rab)
    )
    
    # Risk Flagging
    if price_variance_pct > 10 or volume_variance_pct > 15:
        requires_justification = True
        severity = "HIGH"
    elif price_variance_pct > 5 or volume_variance_pct > 10:
        severity = "MEDIUM"
    else:
        severity = "LOW"
    
    return {
        "price_variance_pct": price_variance_pct,
        "volume_variance_pct": volume_variance_pct,
        "total_variance_idr": total_variance_idr,
        "severity": severity
    }
```

---

### 3.3 Budget Dashboard Components

#### 3.3.1 Budget Overview Card

```
┌─────────────────────────────────────────────┐
│ PROJECT BUDGET OVERVIEW                     │
├─────────────────────────────────────────────┤
│ Total RAB (Planned):      Rp 5,000,000,000 │
│ Total Spent (Actual):     Rp 5,750,000,000 │
│ Variance:                +Rp   750,000,000 │
│ Variance %:                          +15.0% │
│                                              │
│ Budget Utilization: [████████░░] 115%       │
│ Status: ⚠️ OVERRUN                          │
└─────────────────────────────────────────────┘
```

#### 3.3.2 Category Breakdown

```
┌─────────────────────────────────────────────┐
│ VARIANCE BY CATEGORY                        │
├─────────────────────────────────────────────┤
│ Material:        +12.3%  🔴 HIGH RISK       │
│ Labor:            -2.1%  🟢 ACCEPTABLE      │
│ Equipment:       +25.7%  🔴 CRITICAL        │
│ Subcontractor:    +8.4%  🟡 REVIEW          │
└─────────────────────────────────────────────┘
```

#### 3.3.3 Top Variance Items Table

```
┌──────────────────────────────────────────────────────────┐
│ ITEM NAME             │ RAB      │ ACTUAL   │ VAR %     │
├──────────────────────────────────────────────────────────┤
│ Concrete K-300       │ 1500 m³  │ 1275 m³  │ -15.0% 🔴 │
│ Steel Rebar D16      │ 120 ton  │ 156 ton  │ +30.0% 🔴 │
│ Excavation           │ 800 m³   │ 810 m³   │  +1.3% 🟢 │
└──────────────────────────────────────────────────────────┘
```

---

### 3.4 S-Curve Integration

Already implemented in `AnalyticsService.get_s_curve_data()`.

**Enhancement:** Color-code the curve based on variance zones:

- Green: On budget (±5%)
- Yellow: Warning (±10%)
- Red: Critical (>±10%)

---

## 4. API Specification

### 4.1 RAB Upload

```http
POST /api/v2/rab/upload
Content-Type: multipart/form-data

file: <RAB file>
project_id: "PROJ-abc123"
```

**Response:**

```json
{
  "status": "success",
  "lines_imported": 127,
  "parsing_summary": {
    "columns_detected": ["Item Name", "Quantity", "Unit", "Unit Price"],
    "schema_confidence": 0.95,
    "quality_score": 92
  },
  "warnings": [
    "Row 45: Missing unit price, using average"
  ]
}
```

### 4.2 Get Project RAB

```http
GET /api/v2/rab/project/{project_id}?category=Material
```

**Response:**

```json
{
  "project_id": "PROJ-abc123",
  "total_lines": 127,
  "budget_lines": [
    {
      "id": "BL-f8a3c1e2",
      "item_name": "Concrete K-300",
      "category": "Material",
      "qty_rab": 1500.0,
      "unit": "m3",
      "unit_price_rab": 1200000,
      "total_price_rab": 1800000000,
      "qty_actual": 1275.0,
      "avg_unit_price_actual": 1350000,
      "markup_percentage": 12.5,
      "volume_discrepancy": -225.0,
      "requires_justification": true
    }
  ]
}
```

### 4.3 Variance Analysis

```http
GET /api/v2/rab/variance/{project_id}
```

**Response:**

```json
{
  "project_id": "PROJ-abc123",
  "total_variance_idr": 750000000,
  "total_variance_pct": 15.0,
  "severity": "HIGH",
  "category_breakdown": [
    {
      "category": "Material",
      "variance_pct": 12.3,
      "variance_idr": 456000000,
      "severity": "HIGH"
    }
  ],
  "top_overruns": [
    {
      "item_name": "Steel Rebar D16",
      "variance_pct": 30.0,
      "variance_idr": 156000000
    }
  ]
}
```

---

## 5. Implementation Plan

### Phase 1: Core RAB Service (Week 1)

- [x] `BudgetLine` model exists
- [ ] Create `RABService` class
- [ ] Implement Excel parsing (pandas)
- [ ] Implement PDF parsing (Gemini Vision)
- [ ] Schema inference integration

### Phase 2: API Endpoints (Week 1-2)

- [ ] `/api/v2/rab/upload` endpoint
- [ ] `/api/v2/rab/project/{id}` endpoint
- [ ] `/api/v2/rab/variance/{id}` endpoint
- [ ] `/api/v2/rab/recalculate` endpoint

### Phase 3: Frontend Integration (Week 2)

- [ ] RAB Upload Page (`/ingestion/rab`)
- [ ] Budget Dashboard Component
- [ ] Variance Alert System
- [ ] S-Curve color-coding

### Phase 4: Advanced Features (Week 3)

- [ ] Real-time variance recalculation (WebSocket)
- [ ] AI-powered budget forecasting
- [ ] Historical RAB comparison (tracking amendments)
- [ ] Export to audit reports (PDF/Excel)

---

## 6. Technical Considerations

### 6.1 Performance Optimization

**Challenge:** Large RAB files (1000+ line items) + real-time variance calculation

**Solutions:**

1. **Batch Processing:** Use Celery for async RAB parsing
2. **Incremental Updates:** Only recalculate affected budget lines
3. **Materialized Views:** Pre-aggregate variance metrics
4. **Caching:** Redis cache for variance summaries (TTL: 5 minutes)

### 6.2 Data Quality

**Validations:**

1. **No negative values** for qty or unit_price
2. **Unit standardization** (m³ = m3 = kubik)
3. **Price reasonableness** (flag if unit_price > 10x market average)
4. **Duplicate detection** (same item_name within project)

### 6.3 Multi-Currency Support

Currently Rupiah (IDR) only. Future:

- Store `currency` field in `BudgetLine`
- Use `CurrencyService` for exchange rate conversion
- Display in user's preferred currency

---

## 7. Security & Compliance

### 7.1 Access Control

- **Upload:** Project Manager, Auditor roles only
- **View:** All project members
- **Edit/Delete:** Admin + Project Owner only

### 7.2 Audit Trail

- Log all RAB uploads to `AuditLog` table
- Track variance recalculations
- Immutable RAB versions (amendments create new records)

### 7.3 Data Integrity

- Hash RAB file on upload (SHA-256)
- Store in `IntegrityRegistry`
- Prevent tampering with blockchain-style chain-of-custody

---

## 8. Example User Flow

### 8.1 Project Manager Uploads RAB

1. Navigate to `/ingestion/rab`
2. Drag-drop Excel file "RAB_Project_Horizon.xlsx"
3. System parses → 127 items detected
4. Review auto-mapped schema (AI suggests "Jumlah Harga" → "total_price_rab")
5. Confirm → Bulk insert to database
6. Redirect to Budget Dashboard

### 8.2 Auditor Reviews Variance

1. Navigate to `/forensic/analytics`
2. Select "Project Horizon"
3. See Budget Dashboard: +15% overrun (RED alert)
4. Click "View Variance Details"
5. Filter: Category = "Equipment"
6. See: "Excavator rental" has +45% markup
7. Click "Flag for Investigation"
8. System creates Case + assigns to investigator

---

## 9. Integration with Existing Systems

### 9.1 With AnalyticsService

- `get_project_dashboard()` already queries `BudgetLine`
- `get_s_curve_data()` compares RAB vs Actual
- **No changes needed** - already integrated!

### 9.2 With Transactions

- When transaction is verified, trigger `recalculate_variance()`
- Update `BudgetLine.qty_actual` and `avg_unit_price_actual`
- Re-compute `markup_percentage`

### 9.3 With Reasoning Engine

- Feed variance data to `FrenlyOrchestrator`
- Generate hypotheses like:
  - "Steel rebar shows +30% markup across 5 transactions"
  - "Excavation volume reduced by 15% - possible site fraud"

---

## 10. Success Metrics

1. **Upload Success Rate:** >95% for Excel, >80% for PDF
2. **Parsing Accuracy:** >90% schema inference accuracy
3. **Performance:** <5 seconds for 500-line RAB processing
4. **Detection Rate:** Variance flags catch >85% of known fraud cases
5. **User Adoption:** 100% of auditors use RAB Dashboard within 1 month

---

## 11. Conclusion

The RAB Integration System transforms Zenith from a transaction-focused platform to a comprehensive **budget forensics suite**. By connecting planned budgets with actual spend, it enables:

- **Early Detection:** Catch overruns before they become catastrophic
- **Forensic Precision:** Quantify markup fraud at line-item level
- **AI-Powered Insights:** Automatic hypothesis generation
- **Legal Evidence:** Immutable audit trails for court proceedings

**Next Steps:**

1. Implement `RABService` (2 days)
2. Create upload API endpoint (1 day)
3. Build frontend upload UI (2 days)
4. Integrate with existing dashboards (1 day)

**Total Estimated Effort:** 1 week for MVP, 3 weeks for production-ready system.
