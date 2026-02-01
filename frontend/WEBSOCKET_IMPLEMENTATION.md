# WebSocket Server Implementation Guide

## Overview
The Zenith Forensic Platform now uses WebSocket connections for real-time updates instead of polling. This provides significant performance improvements and reduces server load.

## Server Implementation

### WebSocket Endpoints

#### `/forensic/{projectId}/updates`
Establishes a WebSocket connection for real-time updates for a specific project.

**Connection URL:** `ws://localhost:8000/forensic/{projectId}/updates`

### Message Protocol

#### Client Messages

**INITIAL_DATA**
```json
{
  "type": "INITIAL_DATA",
  "timestamp": 1640995200000
}
```

#### Server Messages

**STATS_UPDATE**
```json
{
  "type": "STATS_UPDATE",
  "payload": {
    "risk_index": 75,
    "total_leakage_identified": 1500000000000,
    "active_investigations": 12,
    "pending_alerts": 8,
    "hotspots": [
      { "lat": -6.2088, "lng": 106.8456, "intensity": 0.85 }
    ]
  }
}
```

**ALERTS_UPDATE**
```json
{
  "type": "ALERTS_UPDATE",
  "payload": [
    {
      "id": "ALT-ABC123",
      "severity": "CRITICAL",
      "type": "ANOMALY_DETECTED",
      "message": "Unusual transaction pattern detected",
      "timestamp": "2024-01-15T10:30:00Z",
      "action": {
        "label": "Investigate",
        "route": "/investigate?id=ABC123"
      }
    }
  ]
}
```

**FORECAST_UPDATE**
```json
{
  "type": "FORECAST_UPDATE",
  "payload": {
    "project_name": "Jakarta Infrastructure Audit",
    "contract_value": 5000000000000,
    "realized_spend": 2500000000000,
    "current_leakage": 75000000000,
    "leakage_rate_percent": 3.0,
    "predicted_total_leakage": 150000000000,
    "risk_status": "ELEVATED"
  }
}
```

**ERROR**
```json
{
  "type": "ERROR",
  "message": "Project not found or access denied"
}
```

## Example Node.js Implementation

```javascript
const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ 
  server,
  path: '/forensic/:projectId/updates'
});

// Store connections by project
const projectConnections = new Map();

wss.on('connection', (ws, req) => {
  const projectId = req.url.split('/')[2]; // Extract from /forensic/{projectId}/updates
  
  if (!projectConnections.has(projectId)) {
    projectConnections.set(projectId, new Set());
  }
  
  projectConnections.get(projectId).add(ws);
  console.log(`Client connected to project ${projectId}`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'INITIAL_DATA':
          await sendInitialData(ws, projectId);
          break;
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'ERROR',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    projectConnections.get(projectId)?.delete(ws);
    console.log(`Client disconnected from project ${projectId}`);
    
    if (projectConnections.get(projectId)?.size === 0) {
      projectConnections.delete(projectId);
    }
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for project ${projectId}:`, error);
  });
});

async function sendInitialData(ws, projectId) {
  try {
    // Fetch current data
    const [stats, alerts, forecast] = await Promise.all([
      getProjectStats(projectId),
      getProjectAlerts(projectId),
      getProjectForecast(projectId)
    ]);

    // Send initial data
    ws.send(JSON.stringify({
      type: 'STATS_UPDATE',
      payload: stats
    }));

    ws.send(JSON.stringify({
      type: 'ALERTS_UPDATE',
      payload: alerts
    }));

    ws.send(JSON.stringify({
      type: 'FORECAST_UPDATE',
      payload: forecast
    }));

  } catch (error) {
    ws.send(JSON.stringify({
      type: 'ERROR',
      message: error.message
    }));
  }
}

// Function to broadcast updates to all clients in a project
function broadcastToProject(projectId, message) {
  const connections = projectConnections.get(projectId);
  if (connections) {
    const data = JSON.stringify(message);
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data);
      }
    });
  }
}

// Example: Broadcast when new alert is generated
function onNewAlert(projectId, alert) {
  broadcastToProject(projectId, {
    type: 'ALERTS_UPDATE',
    payload: [alert]
  });
}

// Example: Broadcast when stats are updated
function onStatsUpdate(projectId, stats) {
  broadcastToProject(projectId, {
    type: 'STATS_UPDATE',
    payload: stats
  });
}

server.listen(8000, () => {
  console.log('WebSocket server started on port 8000');
});
```

## Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_WS_URL=ws://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Fallback Mechanism

The client automatically falls back to polling (30-second intervals) if WebSocket connection fails, ensuring the application remains functional in development environments without WebSocket support.

## Performance Benefits

- **Reduced Server Load**: Eliminates 3 polling intervals (5s, 15s, 60s) per client
- **Real-time Updates**: Instant delivery of alerts and stats changes
- **Bandwidth Efficiency**: Only sends data when changes occur
- **Connection Reuse**: Single persistent connection instead of multiple HTTP requests

## Security Considerations

- Implement authentication for WebSocket connections
- Validate project access permissions
- Rate limit WebSocket connections
- Implement proper connection cleanup on server restart