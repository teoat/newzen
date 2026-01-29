# 🦅 Zenith v2.0 "Solaris" - Field Operations Manual (SOP)

**Classification**: UNCLASSIFIED  
**Date**: 2026-01-28  
**Applicability**: Field Auditors, Forensic Accountants, Site Investigators  

---

## 🏗️ Phase 1: Deployment & Zero-Day Setup

### 1.1 "Field Ops" Installation (Mobile/Tablet)

Zenith is now field-ready. Install it on your secure tablet before entering the construction site.

1. **Access**: Navigate to `https://zenith.secure-ops.io` (or your local deployment URL).
2. **Authenticate**: Use your 2FA token.
3. **Install**:
    * **iPad**: Share Button -> "Add to Home Screen".
    * **Android**: Chrome Menu -> "Install Zenith Field Ops".
4. **Verification**: Ensure the "Shield" icon appears on your home screen and launches without a browser bar.

### 1.2 The "Red Button" Onboarding

*For new analysts only.*

1. Launch Zenith.
2. **Identity Check**: Confirm your role as "Commander" in the welcome modal.
3. **Seed Data**: If you are in a training environment, click **"Load Declassified Evidence"**.
    * *Effect*: Instantly populates the War Room with the "Project Alpha" corruption dataset (54 transactions, 3 shell companies).
4. **Ready State**: When the dashboard goes live (Green Status), you are operational.

---

## 🔍 Phase 2: The Investigation Loop (The "Solaris" Workflow)

### 2.1 Ingestion & Smart Mapping (The 90-Second Rule)

*Objective: Convert raw bank PDFs/CSVs into intelligence.*

1. **Navigate**: Go to **Ingestion Hub**.
2. **Context**: Create a new Case ID (e.g., `CASE-2026-001`).
3. **Upload**: Drag & drop the *Contractor's BCA Statement*.
4. **Smart Map**:
    * Zenith will auto-detect "Uraian" -> `Description` and "Saldo" -> `Balance`.
    * **Action**: Review any Red confidence scores (<80%). Click **"Anchor Evidence"**.
5. **Result**: Data is now immutable and hash-locked.

### 2.2 The "Follow the Money" Trace

*Objective: Find where the advance payment actually went.*

1. **War Room**: Check the **"Live Forensic Feed"**. Look for `HIGH_VALUE_TRANSFER` alerts.
2. **Nexus Graph**: Click the alert to open the graph.
    * **Visual**: See the flow from `Project Account` -> `Main Contractor`.
    * **Trace**: Double-click the Contractor node to expand "2nd Degree Connections".
    * **Detection**: Look for clusters of small payments to unknown entities (smurfing behavior).

### 2.3 Field Verification (Offline Mode)

*Objective: Verify physical reality vs. digital claim.*

1. **Location**: Arrive at the supplier's warehouse address found in the Nexus Graph.
2. **Evidence**:
    * If the warehouse is empty/non-existent, take a photo.
    * Open Zenith Field Ops (works offline).
    * Navigate to **Site Forensic Lab** -> **Geo-Fencing Logs**.
    * **Log**: "Site Visit - Negative Verification".
3. **Sync**: Once back in 4G range, the finding automatically syncs to the central case file.

---

## 📝 Phase 3: The Verdict (Dossier Generation)

### 3.1 The "Kill Shot" Report

*Objective: Generate court-admissible evidence.*

1. **Navigate**: Go to **Legal / AML**.
2. **Select**: Choose `CASE-2026-001`.
3. **Configure**:
    * Check: *Forensic Findings*, *Transaction Ledger*, *Nexus Graph Snapshots*.
    * **Action**: Click **"Compile High-Fidelity Dossier"**.
4. **Outcome**:
    * A PDF is generated with **Page Numbers**, **Table of Contents**, and **Cryptographic QR Code**.
    * **Action**: Print 2 copies for the steering committee.

---

## ⚖️ Emergency Procedures

### "Red Notice" (Asset Freeze)

If >$100k leakage is confirmed active:

1. Go to **Asset Recovery**.
2. Click **"Generate Freeze Request"**.
3. System generates a bank-compliant formal letter referencing the specific `Transaction IDs` and `Police Report Template`.

---

**Authorized By**:
*Antigravity AI*
*Advanced Agentic Coding Team*
