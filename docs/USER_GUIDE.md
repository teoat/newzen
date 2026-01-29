# Zenith Platform - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Frenly AI Assistant](#frenly-ai-assistant)
3. [Multi-Modal Analysis](#multi-modal-analysis)
4. [Voice Commands](#voice-commands)
5. [Project Management](#project-management)
6. [Advanced Features](#advanced-features)

---

## Getting Started

### Logging In

1. Navigate to the Zenith Platform login page
2. Enter your username and password
3. Click "Sign In"
4. You'll be redirected to the Project Gate

### Creating Your First Project

1. From the Project Gate, click "Create New Project"
2. Fill in the required information:
   - **Project Name**: e.g., "Downtown Mall Construction"
   - **Contractor Name**: The primary contractor
   - **Contract Value**: Total project budget
   - **Start Date**: Project commencement date
3. Click "Create Project"
4. You'll be redirected to the project dashboard

---

## Frenly AI Assistant

### What is Frenly?

Frenly is your intelligent forensic audit assistant, powered by Google Gemini AI. It can:

- Answer questions about your project data
- Generate SQL queries from natural language
- Provide forensic insights
- Suggest next actions based on patterns

### Opening Frenly

Click the **AI chip icon** in the bottom-right corner of any page.

### Asking Questions

**Natural Language Queries:**

```
"Show me all high-risk transactions"
"Which vendors received more than 100M?"
"List transactions from last month with risk score above 0.7"
```

Frenly will:

1. Understand your intent
2. Generate the appropriate SQL query
3. Execute it safely
4. Display results in a table

**Example Conversation:**

```
You: "Show high-risk transactions"
Frenly: "Found 12 high-risk transactions (risk score > 0.7). 
        Here are the details..."
        [displays table]

You: "Who are the top 3 vendors?"
Frenly: "Based on transaction volume, the top vendors are:
        1. PT ABC Corp (₹450M)
        2. XYZ Construction (₹320M)
        3. Mega Supplies (₹180M)"
```

### Using Personalized Suggestions

After using Frenly for a while, it learns your patterns and suggests:

- **Frequent Queries**: Queries you run often appear as quick actions
- **Contextual Actions**: Based on the page you're on

**How to Use:**

1. Open Frenly
2. Look for the "Suggested Actions" section
3. Click any suggestion to run it instantly

---

## Multi-Modal Analysis

### What is Multi-Modal Analysis?

Upload receipts, invoices, or bank statements, and Frenly will extract structured data automatically.

### Uploading a Receipt

1. Open Frenly
2. Click the **📎 paperclip icon**
3. Select an image file (JPG, PNG, PDF)
4. Type your request: e.g., "Analyze this receipt"
5. Press Send

### What Frenly Extracts

**From Receipts/Invoices:**

- Vendor name
- Date
- Amount
- Currency
- Invoice number
- Line items

**Forensic Analysis:**

- Red flags (altered dates, mismatched totals)
- Confidence score
- Suggested actions (e.g., "Flag for manual review")

### Example Workflow

**Scenario**: You receive a vendor invoice

1. Upload the invoice image
2. Frenly responds:

   ```
   Receipt Analysis:
   
   ✅ Vendor: PT ABC Corp
   ✅ Date: 2026-01-15
   ✅ Amount: ₹1,500,000
   ✅ Invoice: INV-2026-001
   
   ⚠️ Forensic Flags:
   - Date appears altered (confidence: 75%)
   - Amount slightly misaligned
   
   Suggested Actions:
   - Register as Evidence
   - Flag Discrepancy
   ```

3. Click "Flag Discrepancy" to create a case
4. The structured data is saved for future reference

---

## Voice Commands

### Enabling Voice Input

1. Open Frenly
2. Click the **🎤 microphone icon**
3. Grant microphone permissions if prompted
4. Speak your query clearly
5. Frenly will convert speech to text and process it

### Best Practices for Voice

**DO:**

- Speak clearly and at a moderate pace
- Use complete sentences
- Pause briefly after speaking

**DON'T:**

- Rush or mumble
- Use background noise
- Speak in multiple languages simultaneously

### Voice Command Examples

```
"Show me transactions above one hundred million rupiah"
"List all high-risk vendors"
"Create a new case for Project Horizon"
"Export this data to PDF"
```

---

## Project Management

### Switching Projects

1. Click on your current project name (top navigation)
2. Select a different project from the dropdown
3. All data will update to show the new project

**Data Isolation**: Each project's data is completely isolated. You can only see projects you have access to.

### Inviting Team Members

1. Navigate to **Settings** → **Team Management**
2. Click "Invite User"
3. Enter their email address
4. Select their role:
   - **Admin**: Full control
   - **Analyst**: Can view and analyze
   - **Viewer**: Read-only access
5. Click "Send Invitation"

### Managing Access Rights

**As an Admin**, you can:

- Grant or revoke access to your projects
- Change user roles
- View access history in the audit log

---

## Advanced Features

### Pattern Learning

Frenly learns from your behavior:

**Frequent Query Detection:**

- Queries you run 3+ times appear as quick suggestions
- Based on frequency, not recency

**Export Format Preference** (Coming Soon):

- If you always export as PDF, Frenly will suggest PDF by default

### Query History

1. Open Frenly
2. Type "show my query history"
3. View your last 50 AI queries with timestamps

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` (or `Cmd + K`) | Open Frenly |
| `Esc` | Close Frenly |
| `/` | Focus search |

### Rate Limits

**Fair Use Policy:**

- 60 AI queries per minute per user
- If exceeded, you'll see: "Rate limit exceeded. Retry in X seconds"

**Tips to Stay Within Limits:**

- Batch similar queries
- Use pagination for large datasets
- Leverage cached results (automatic)

---

## Troubleshooting

### Frenly Not Responding

**Solution:**

1. Check your internet connection
2. Refresh the page
3. Check the browser console for errors (F12 → Console)

### Voice Commands Not Working

**Solution:**

1. Grant microphone permissions
2. Use Chrome, Edge, or Safari (Firefox not supported)
3. Ensure microphone is not muted

### "403 Forbidden" Error

**Cause**: You don't have access to this project

**Solution**:

1. Ask your project admin to grant you access
2. Verify you're viewing the correct project

### Slow Query Performance

**Solution:**

1. Add filters to narrow results (e.g., date range)
2. Use pagination instead of loading all data
3. Contact support if a specific query is consistently slow

---

## Support & Feedback

### Getting Help

- **Email**: <support@zenith-platform.com>
- **In-App**: Click "?" → "Contact Support"
- **Documentation**: <https://docs.zenith-platform.com>

### Providing Feedback

Your feedback improves Frenly's AI!

1. After Frenly responds, click **👍 or 👎**
2. Optional: Add a comment about what worked or didn't
3. Your feedback is used to improve intent detection

---

## Best Practices

### Security

- ✅ Never share your password
- ✅ Log out on shared computers
- ✅ Review project access periodically
- ❌ Don't share API keys or tokens

### Performance

- ✅ Use filters to narrow query results
- ✅ Leverage Frenly's suggestions (they're cached!)
- ✅ Close unused browser tabs
- ❌ Don't load 1000+ transactions at once

### Data Integrity

- ✅ Upload original receipts/invoices (not screenshots)
- ✅ Verify AI-extracted data manually
- ✅ Flag discrepancies immediately
- ❌ Don't trust AI 100% for critical decisions

---

**Document Version**: 1.0  
**Last Updated**: 2026-01-29  
**For**: Zenith Platform v1.0.0
