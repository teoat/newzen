# Zenith Lite: User Guide

## 1. The Autonomous System (V3)

Zenith V3 introduces "Visible Autonomy". The system now has active agents working in the background to audit and repair your data.

### 🕵️ Auditor Agent

- **What it does**: Listens to every transaction you upload.
- **Trigger**: New Transaction Created.
- **Action**: Runs "Prophet V2" risk analysis. If the risk > 50, it automatically creates a **Fraud Alert**.
- **Observability**: You can see the lag (events pending) in the **Agent Status** widget on the dashboard.

### 🚑 Nurse Agent

- **What it does**: Patrols the "Data Hospital" (failed uploads).
- **Trigger**: File upload row fails parsing (e.g., bad date format, JSON error).
- **Action**: Tries to heuristically fix the data.
  - If fixed: Marked as `Repaired`.
  - If failed: Marked as `Needs Specialist`.

---

## 2. Ingestion & Data Hospital

When you upload data (`/ingestion`), some rows might fail.

1. **Go to Admin > Data Hospital**: (`/admin/data-hospital`)
2. **Review Triage**: See the list of failed rows.
3. **Use the Patient Chart**: Click "Treat" to open the raw data editor.
4. **Manual Fix**: Correct the JSON/CSV error and click "Resolve". The Nurse Agent will pick it up (or it will be re-ingested immediately).

---

## 3. Evidence & RAG

- **Upload**: Go to Case Details and upload PDFs/Images.
- **Analysis**: The system encrypts the file (AES-256) and extracts text for the Vector DB.
- **Search**: Use the Global Command Bar (`Cmd+K`) to search across all evidence. The search uses Semantic Matching (RAG).
