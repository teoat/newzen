# Auditor Agent Integration

The `AuditorAgent` has been integrated directly into the core application runtime.

## Integration Strategy: "Embedded Autonomy"

We chose the **Embedded Background Task** strategy for Zenith Lite. This allows the agent to run within the same container as the API, reducing deployment complexity while maintaining asynchronous autonomy.

### 1. Implementation (`app/main.py`)

- **Hook**: `@app.on_event("startup")`
- **Method**: `asyncio.create_task(auditor.run_forever())`
- **Configuration**: Controlled via `ENABLE_EMBEDDED_AGENTS=true`

### 2. Benefits

- **Zero Ops**: No new containers to manage.
- **Immediate Feedback**: As soon as the API generates a transaction event, the embedded agent sees it in the Redis Stream.
- **Resource Efficient**: Uses the same `uvicorn` event loop, sharing database connection pools.

### 3. Safety Mechanisms

- **Non-Blocking**: The agent runs in a separate `asyncio` task, so it never blocks HTTP requests.
- **Toggleable**: Can be disabled via ENV var if we scale to dedicated worker nodes later.

### 4. Verification

To verify the agent is running, check the application logs during startup for:
`🤖 V3 Autonomy: Launching Embedded Auditor Agent...`

Then, create a transaction and watch the logs for:
`🕵️ Auditor Agent 'embedded_auditor' started...`
`Analyzing Transaction ...`
