# 🎨 ZENITH PLATFORM - VISUAL ARCHITECTURE DIAGRAMS

**Purpose:** Complete visual documentation for v3.0 architecture  
**Format:** Mermaid diagrams (render in GitHub, Notion, or mermaid.live)  
**Date:** 2026-01-31

---

## 📊 1. SYSTEM ARCHITECTURE - 7-LAYER OVERVIEW

```mermaid
graph TB
    subgraph "LAYER 7: Testing & Quality Assurance"
        TEST[Integration Tests<br/>Contract Tests<br/>E2E Tests]
        CI[CI/CD Pipeline<br/>GitHub Actions]
    end
    
    subgraph "LAYER 6: Frontend Application"
        NEXT[Next.js<br/>React 18<br/>TypeScript]
        COMPONENTS[Forensic Components<br/>VirtualizedTimeline<br/>NexusGraph]
        UI[UI Library<br/>Tailwind CSS]
    end
    
    subgraph "LAYER 5: Data Processing"
        ING[Ingestion Service<br/>CSV/PDF/Images]
        REC[Reconciliation Engine<br/>Fuzzy Matching]
        RAB[RAB Analysis<br/>Material Synthesis]
    end
    
    subgraph "LAYER 4: Forensic Analysis"
        FRENLY[Frenly AI Orchestrator<br/>Gemini 2.5 Flash]
        VISION[Vision Service<br/>Photo Analysis]
        NETWORK[Network Service<br/>NetworkX]
        GEO[Geocoding Service<br/>Maps API]
    end
    
    subgraph "LAYER 3: AI & Intelligence"
        SQL[SQL Generator<br/>Text-to-SQL]
        REASON[Reasoning Engine<br/>Hypothesis Gen]
        JUDGE[THE JUDGE<br/>Auto-Prosecution]
        PROPHET[THE PROPHET<br/>Prediction]
    end
    
    subgraph "LAYER 2: Authentication & Authorization"
        AUTH[Auth Service<br/>JWT + bcrypt]
        RBAC[RBAC System<br/>UserProjectAccess]
        MFA[MFA Service<br/>TOTP]
    end
    
    subgraph "LAYER 1: Infrastructure & Deployment"
        POSTGRES[(PostgreSQL<br/>SQLModel)]
        REDIS[(Redis<br/>Cache + Sessions)]
        S3[(S3/MinIO<br/>Evidence Storage)]
        DOCKER[Docker<br/>Kubernetes]
    end
    
    %% Connections
    NEXT --> COMPONENTS
    COMPONENTS --> FRENLY
    COMPONENTS --> NETWORK
    COMPONENTS --> GEO
    
    FRENLY --> SQL
    FRENLY --> REASON
    FRENLY --> JUDGE
    FRENLY --> PROPHET
    
    NETWORK --> POSTGRES
    GEO --> POSTGRES
    RAB --> POSTGRES
    REC --> POSTGRES
    
    AUTH --> POSTGRES
    AUTH --> REDIS
    RBAC --> POSTGRES
    
    TEST --> CI
    CI --> DOCKER
    
    classDef layer1 fill:#1e40af,stroke:#1e3a8a,color:#fff
    classDef layer2 fill:#059669,stroke:#047857,color:#fff
    classDef layer3 fill:#dc2626,stroke:#b91c1c,color:#fff
    classDef layer4 fill:#7c3aed,stroke:#6d28d9,color:#fff
    classDef layer5 fill:#ea580c,stroke:#c2410c,color:#fff
    classDef layer6 fill:#0891b2,stroke:#0e7490,color:#fff
    classDef layer7 fill:#4b5563,stroke:#374151,color:#fff
    
    class POSTGRES,REDIS,S3,DOCKER layer1
    class AUTH,RBAC,MFA layer2
    class SQL,REASON,JUDGE,PROPHET layer3
    class FRENLY,VISION,NETWORK,GEO layer4
    class ING,REC,RAB layer5
    class NEXT,COMPONENTS,UI layer6
    class TEST,CI layer7
```

---

## 🔄 2. DATA FLOW DIAGRAM - TRANSACTION ANALYSIS

```mermaid
flowchart LR
    subgraph "USER INPUT"
        USER[👤 Forensic Analyst]
        UPLOAD[📄 Upload Transactions]
    end
    
    subgraph "INGESTION LAYER"
        PARSE[CSV Parser<br/>Schema Mapper]
        VALIDATE[Data Validator<br/>Type Checking]
        STORE[Store to DB<br/>PostgreSQL]
    end
    
    subgraph "PROCESSING LAYER"
        RECON[Reconciliation<br/>Bank Match]
        FORENSIC[Forensic Triggers<br/>Velocity/Channel]
        RISK[Risk Scoring<br/>ML Model]
    end
    
    subgraph "ANALYSIS LAYER"
        NETWORK_ANALYZE[Network Analysis<br/>Graph Construction]
        GEO_ANALYZE[Geo Analysis<br/>Location Mapping]
        TIMELINE[Timeline<br/>Chronology]
    end
    
    subgraph "VISUALIZATION"
        NEXUS[Nexus Graph<br/>Force-Directed]
        MAP[Geo Map<br/>Leaflet]
        CHRONO[Timeline<br/>Virtualized]
        ANALYTICS[Analytics<br/>Dashboard]
    end
    
    subgraph "AI LAYER"
        FRENLY_AI[Frenly AI<br/>Gemini 2.5]
        HYPOTHESIS[Hypothesis<br/>Generation]
        VERDICT[Verdict<br/>Package]
    end
    
    USER --> UPLOAD
    UPLOAD --> PARSE
    PARSE --> VALIDATE
    VALIDATE --> STORE
    
    STORE --> RECON
    STORE --> FORENSIC
    FORENSIC --> RISK
    
    RISK --> NETWORK_ANALYZE
    RISK --> GEO_ANALYZE
    RISK --> TIMELINE
    
    NETWORK_ANALYZE --> NEXUS
    GEO_ANALYZE --> MAP
    TIMELINE --> CHRONO
    RISK --> ANALYTICS
    
    NEXUS --> FRENLY_AI
    FORENSIC --> FRENLY_AI
    FRENLY_AI --> HYPOTHESIS
    HYPOTHESIS --> VERDICT
    
    classDef input fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef ingest fill:#10b981,stroke:#059669,color:#fff
    classDef process fill:#f59e0b,stroke:#d97706,color:#fff
    classDef analyze fill:#8b5cf6,stroke:#7c3aed,color:#fff
    classDef viz fill:#ec4899,stroke:#db2777,color:#fff
    classDef ai fill:#ef4444,stroke:#dc2626,color:#fff
    
    class USER,UPLOAD input
    class PARSE,VALIDATE,STORE ingest
    class RECON,FORENSIC,RISK process
    class NETWORK_ANALYZE,GEO_ANALYZE,TIMELINE analyze
    class NEXUS,MAP,CHRONO,ANALYTICS viz
    class FRENLY_AI,HYPOTHESIS,VERDICT ai
```

---

## 🤖 3. V3.0 AUTONOMOUS SYSTEMS ARCHITECTURE

```mermaid
graph TB
    subgraph "INVESTIGATION DATA"
        EVIDENCE[📁 Evidence<br/>Documents, Photos]
        TRANSACTIONS[💰 Transactions<br/>Ledger Data]
        ENTITIES[🏢 Entities<br/>Vendors, Contractors]
    end
    
    subgraph "THE JUDGE - Autonomous Adjudication"
        JUDGE_GATHER[Gather Evidence<br/>Cryptographic Hashing]
        JUDGE_ANALYZE[LLM Analysis<br/>Narrative Generation]
        JUDGE_LEGAL[Legal DB<br/>Precedent Search]
        JUDGE_SCORE[Confidence Scoring<br/>0-100%]
        JUDGE_DOSSIER[📋 Verdict Package<br/>Court-Ready PDF]
        JUDGE_BLOCKCHAIN[⛓️ Blockchain<br/>Evidence Anchoring]
    end
    
    subgraph "THE PROPHET - Predictive Compliance"
        PROPHET_INTERCEPT[🚨 Tx Interceptor<br/>Real-Time Analysis]
        PROPHET_ML[ML Model<br/>Fraud Prediction]
        PROPHET_BUDGET[Budget Forecast<br/>Exhaustion Prediction]
        PROPHET_VENDOR[Vendor Screening<br/>Sanction Lists]
        PROPHET_LEARN[Continuous Learning<br/>Feedback Loop]
    end
    
    subgraph "THE ARCHITECT - Digital Twin"
        ARCH_PHOTOS[📸 Site Photos<br/>2D Images]
        ARCH_NERF[NeRF Processor<br/>3D Reconstruction]
        ARCH_BIM[BIM Comparison<br/>Design vs Reality]
        ARCH_SAT[🛰️ Satellite<br/>Historical Imagery]
        ARCH_MEASURE[Volume Calculator<br/>Variance Detection]
        ARCH_VIEWER[3D Viewer<br/>Browser Rendering]
    end
    
    subgraph "GUARDRAILS & SAFETY"
        AUTHORITY[Authority Check<br/>Impact Level]
        SIMULATE[Consequence Sim<br/>Risk Assessment]
        HUMAN[👤 Human Approval<br/>Critical Decisions]
        AUDIT[📝 Audit Log<br/>All Actions]
        KILL[🛑 Kill Switch<br/>Emergency Stop]
    end
    
    %% Judge Flow
    EVIDENCE --> JUDGE_GATHER
    TRANSACTIONS --> JUDGE_GATHER
    JUDGE_GATHER --> JUDGE_ANALYZE
    JUDGE_ANALYZE --> JUDGE_LEGAL
    JUDGE_LEGAL --> JUDGE_SCORE
    JUDGE_SCORE --> JUDGE_DOSSIER
    JUDGE_DOSSIER --> JUDGE_BLOCKCHAIN
    
    %% Prophet Flow
    TRANSACTIONS --> PROPHET_INTERCEPT
    PROPHET_INTERCEPT --> PROPHET_ML
    PROPHET_ML --> PROPHET_BUDGET
    ENTITIES --> PROPHET_VENDOR
    PROPHET_VENDOR --> PROPHET_LEARN
    PROPHET_ML --> PROPHET_LEARN
    
    %% Architect Flow
    EVIDENCE --> ARCH_PHOTOS
    ARCH_PHOTOS --> ARCH_NERF
    ARCH_NERF --> ARCH_BIM
    ARCH_SAT --> ARCH_BIM
    ARCH_BIM --> ARCH_MEASURE
    ARCH_MEASURE --> ARCH_VIEWER
    
    %% Guardrails
    JUDGE_DOSSIER --> AUTHORITY
    PROPHET_INTERCEPT --> AUTHORITY
    ARCH_MEASURE --> AUTHORITY
    AUTHORITY --> SIMULATE
    SIMULATE --> HUMAN
    HUMAN --> AUDIT
    AUDIT --> KILL
    
    classDef data fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef judge fill:#10b981,stroke:#059669,color:#fff
    classDef prophet fill:#f59e0b,stroke:#d97706,color:#fff
    classDef architect fill:#8b5cf6,stroke:#7c3aed,color:#fff
    classDef safety fill:#ef4444,stroke:#dc2626,color:#fff
    
    class EVIDENCE,TRANSACTIONS,ENTITIES data
    class JUDGE_GATHER,JUDGE_ANALYZE,JUDGE_LEGAL,JUDGE_SCORE,JUDGE_DOSSIER,JUDGE_BLOCKCHAIN judge
    class PROPHET_INTERCEPT,PROPHET_ML,PROPHET_BUDGET,PROPHET_VENDOR,PROPHET_LEARN prophet
    class ARCH_PHOTOS,ARCH_NERF,ARCH_BIM,ARCH_SAT,ARCH_MEASURE,ARCH_VIEWER architect
    class AUTHORITY,SIMULATE,HUMAN,AUDIT,KILL safety
```

---

## 🔌 4. API INTEGRATION MAP

```mermaid
graph LR
    subgraph "FRONTEND"
        NEXUS_PAGE[Nexus Graph Page]
        MAP_PAGE[Geo Map Page]
        TIMELINE_PAGE[Timeline Page]
        ANALYTICS_PAGE[Analytics Page]
    end
    
    subgraph "API LAYER"
        GRAPH_API[/api/v2/graph<br/>Network Endpoints]
        GEO_API[/api/v2/geo<br/>Geocoding Endpoints]
        ANALYTICS_API[/api/v2/analytics<br/>Aggregation Endpoints]
        SQL_API[/api/v2/sql<br/>Query Generation]
    end
    
    subgraph "SERVICE LAYER"
        NETWORK_SVC[NetworkService<br/>NetworkX]
        GEO_SVC[GeocodingService<br/>Maps API]
        ANALYTICS_SVC[AnalyticsService<br/>Aggregation]
        SQL_SVC[SQLGenerator<br/>Gemini]
    end
    
    subgraph "DATA LAYER"
        DB[(PostgreSQL)]
        CACHE[(Redis Cache)]
        EXTERNAL[External APIs<br/>Google Maps<br/>Nominatim]
    end
    
    %% Frontend to API
    NEXUS_PAGE -->|GET /network/{id}| GRAPH_API
    NEXUS_PAGE -->|GET /shortest-path| GRAPH_API
    NEXUS_PAGE -->|GET /communities| GRAPH_API
    
    MAP_PAGE -->|GET /entities/{id}| GEO_API
    MAP_PAGE -->|GET /heatmap| GEO_API
    MAP_PAGE -->|GET /cluster| GEO_API
    
    TIMELINE_PAGE -->|Query Events| SQL_API
    ANALYTICS_PAGE -->|Query Metrics| ANALYTICS_API
    
    %% API to Service
    GRAPH_API --> NETWORK_SVC
    GEO_API --> GEO_SVC
    ANALYTICS_API --> ANALYTICS_SVC
    SQL_API --> SQL_SVC
    
    %% Service to Data
    NETWORK_SVC --> DB
    NETWORK_SVC --> CACHE
    
    GEO_SVC --> DB
    GEO_SVC --> CACHE
    GEO_SVC --> EXTERNAL
    
    ANALYTICS_SVC --> DB
    SQL_SVC --> CACHE
    
    classDef frontend fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef api fill:#10b981,stroke:#059669,color:#fff
    classDef service fill:#f59e0b,stroke:#d97706,color:#fff
    classDef data fill:#8b5cf6,stroke:#7c3aed,color:#fff
    
    class NEXUS_PAGE,MAP_PAGE,TIMELINE_PAGE,ANALYTICS_PAGE frontend
    class GRAPH_API,GEO_API,ANALYTICS_API,SQL_API api
    class NETWORK_SVC,GEO_SVC,ANALYTICS_SVC,SQL_SVC service
    class DB,CACHE,EXTERNAL data
```

---

## 🚀 5. DEPLOYMENT ARCHITECTURE

```mermaid
graph TB
    subgraph "DEVELOPERS"
        DEV[👨‍💻 Engineers<br/>Local Dev]
        GIT[📦 GitHub<br/>Version Control]
    end
    
    subgraph "CI/CD PIPELINE"
        BUILD[🔨 Build<br/>Docker Images]
        TEST[🧪 Tests<br/>Pytest + Jest]
        LINT[✨ Linters<br/>Flake8 + ESLint]
        SCAN[🔒 Security<br/>Bandit + npm audit]
    end
    
    subgraph "STAGING ENVIRONMENT"
        K8S_STAGE[☸️ Kubernetes<br/>Staging Cluster]
        DB_STAGE[(PostgreSQL<br/>Staging)]
        REDIS_STAGE[(Redis<br/>Staging)]
    end
    
    subgraph "PRODUCTION ENVIRONMENT"
        LB[⚖️ Load Balancer<br/>Nginx/HAProxy]
        
        subgraph "Backend Services"
            API1[FastAPI<br/>Instance 1]
            API2[FastAPI<br/>Instance 2]
            API3[FastAPI<br/>Instance 3]
        end
        
        subgraph "Frontend Services"
            NEXT1[Next.js<br/>Instance 1]
            NEXT2[Next.js<br/>Instance 2]
        end
        
        subgraph "Data Tier Production"
            DB_PROD[(PostgreSQL<br/>Primary)]
            DB_REPLICA[(PostgreSQL<br/>Replica)]
            REDIS_CLUSTER[(Redis Cluster<br/>HA)]
            S3_PROD[(S3/MinIO<br/>Evidence)]
        end
        
        subgraph "Monitoring"
            PROM[📊 Prometheus<br/>Metrics]
            GRAF[📈 Grafana<br/>Dashboards]
            ELK[📝 ELK Stack<br/>Logs]
        end
    end
    
    %% Development Flow
    DEV --> GIT
    GIT --> BUILD
    BUILD --> TEST
    TEST --> LINT
    LINT --> SCAN
    
    %% Staging Deployment
    SCAN --> K8S_STAGE
    K8S_STAGE --> DB_STAGE
    K8S_STAGE --> REDIS_STAGE
    
    %% Production Deployment
    K8S_STAGE -->|Promote| LB
    LB --> API1
    LB --> API2
    LB --> API3
    LB --> NEXT1
    LB --> NEXT2
    
    API1 --> DB_PROD
    API2 --> DB_PROD
    API3 --> DB_PROD
    
    DB_PROD --> DB_REPLICA
    
    API1 --> REDIS_CLUSTER
    API2 --> REDIS_CLUSTER
    API3 --> REDIS_CLUSTER
    
    API1 --> S3_PROD
    
    %% Monitoring
    API1 --> PROM
    NEXT1 --> PROM
    PROM --> GRAF
    API1 --> ELK
    
    classDef dev fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef ci fill:#10b981,stroke:#059669,color:#fff
    classDef stage fill:#f59e0b,stroke:#d97706,color:#fff
    classDef prod fill:#ef4444,stroke:#dc2626,color:#fff
    classDef monitor fill:#8b5cf6,stroke:#7c3aed,color:#fff
    
    class DEV,GIT dev
    class BUILD,TEST,LINT,SCAN ci
    class K8S_STAGE,DB_STAGE,REDIS_STAGE stage
    class LB,API1,API2,API3,NEXT1,NEXT2,DB_PROD,DB_REPLICA,REDIS_CLUSTER,S3_PROD prod
    class PROM,GRAF,ELK monitor
```

---

## 🔄 6. NETWORK SERVICE WORKFLOW

```mermaid
sequenceDiagram
    participant F as Frontend<br/>(Nexus Graph)
    participant A as API Router<br/>(/api/v2/graph)
    participant N as NetworkService
    participant C as Redis Cache
    participant D as PostgreSQL
    
    F->>A: GET /network/{project_id}
    A->>N: build_network(project_id)
    
    N->>C: Check cache<br/>key: network_graph:{project_id}
    
    alt Cache HIT
        C-->>N: Return cached graph
        N-->>A: {nodes, links, stats}
        A-->>F: JSON response (50ms)
    else Cache MISS
        N->>D: SELECT transactions<br/>WHERE project_id = ?
        D-->>N: Transaction list
        
        N->>N: Build NetworkX<br/>DiGraph
        N->>N: Calculate centrality<br/>metrics
        N->>N: Aggregate links
        
        N->>C: Store in cache<br/>TTL: 600s
        
        N-->>A: {nodes, links, stats}
        A-->>F: JSON response (800ms)
    end
    
    Note over F,D: Shortest Path Feature
    
    F->>A: GET /shortest-path<br/>?source=A&target=B
    A->>N: find_shortest_path(A, B)
    
    N->>N: Use cached graph<br/>if available
    N->>N: NetworkX.shortest_path()
    
    N-->>A: {path, length, amount}
    A-->>F: Path visualization
```

---

## 📍 7. GEOCODING SERVICE WORKFLOW

```mermaid
sequenceDiagram
    participant F as Frontend<br/>(Geo Map)
    participant A as API Router<br/>(/api/v2/geo)
    participant G as GeocodingService
    participant C as Redis Cache
    participant D as PostgreSQL
    participant M as Google Maps API
    participant O as Nominatim (Fallback)
    
    F->>A: GET /entities/{project_id}
    A->>G: geocode_entities(project_id)
    
    G->>D: SELECT transactions + entities
    D-->>G: Entity list with addresses
    
    loop For each entity
        G->>C: Check geocode cache<br/>key: geocode:{address}
        
        alt Cache HIT
            C-->>G: {lat, lng, formatted}
        else Cache MISS
            G->>M: Geocode API request
            
            alt Google Maps Success
                M-->>G: {lat, lng, formatted}
                G->>C: Cache for 24h
            else Google Maps Fail
                G->>O: Nominatim request
                O-->>G: {lat, lng, formatted}
                G->>C: Cache for 24h
            end
        end
    end
    
    G->>G: Calculate map center
    G->>G: Aggregate statistics
    
    G-->>A: {markers, center, stats}
    A-->>F: JSON response
    
    Note over F,O: Heatmap Generation
    
    F->>A: GET /heatmap/{project_id}
    A->>G: generate_heatmap_data()
    
    G->>G: Use geocoded markers
    G->>G: Weight by transaction volume
    
    G-->>A: {heatmap_points, max_intensity}
    A-->>F: Heatmap visualization
```

---

## 🎯 8. SCORING PROGRESS TIMELINE

```mermaid
gantt
    title Zenith Platform - Path to 100/100
    dateFormat YYYY-MM-DD
    section Current
    Diagnostic Framework Complete :done, 2026-01-31, 1d
    Backend Services Implemented :done, 2026-01-31, 1d
    
    section Week 1 (Quick Wins)
    Timeline Virtualization :active, 2026-02-01, 2d
    OpenAPI Documentation : 2026-02-02, 1d
    MFA Implementation : 2026-02-03, 2d
    Integration Testing : 2026-02-04, 1d
    Score: 96.0/100 :milestone, 2026-02-07, 0d
    
    section Week 2-3 (Strategic)
    Architecture Diagrams : 2026-02-08, 2d
    Contract Testing : 2026-02-10, 5d
    SonarQube Integration : 2026-02-15, 3d
    Timeline Event Details : 2026-02-18, 2d
    Score: 98.8/100 :milestone, 2026-02-21, 0d
    
    section Week 4-6 (Excellence)
    ML Anomaly Detection : 2026-02-22, 10d
    GPU Acceleration : 2026-03-04, 8d
    THE JUDGE Implementation : 2026-03-12, 5d
    THE PROPHET Implementation : 2026-03-17, 5d
    Score: 100.0/100 :milestone, 2026-03-21, 0d
    
    section Week 7-8 (Innovation)
    THE ARCHITECT R&D : 2026-03-22, 10d
    Continuous Learning : 2026-04-01, 5d
    Final Polish : 2026-04-06, 2d
    v3.0 Launch :milestone, 2026-04-08, 0d
```

---

## 📊 HOW TO USE THESE DIAGRAMS

### Rendering Options

1. **GitHub/GitLab:** Diagrams render automatically in `.md` files
2. **Mermaid Live:** Copy to <https://mermaid.live> for editing
3. **Notion:** Use Mermaid block type
4. **VS Code:** Install "Markdown Preview Mermaid Support" extension
5. **Draw.io:** Import Mermaid syntax

### Export Options

1. **PNG/SVG:** Use mermaid.live export function
2. **PDF:** Print from browser with diagrams rendered
3. **Presentation:** Include in slides (reveal.js supports Mermaid)

---

## 🎯 DIAGRAM SUMMARY

| **Diagram** | **Purpose** | **Audience** |
|-------------|-------------|--------------|
| 1. System Architecture | High-level 7-layer view | Executives, Architects |
| 2. Data Flow | Transaction processing flow | Engineers, Analysts |
| 3. v3.0 Autonomous | Agent system design | Product, Engineering |
| 4. API Integration | Frontend-backend mapping | Frontend Engineers |
| 5. Deployment | Production infrastructure | DevOps, SRE |
| 6. Network Service | Graph construction workflow | Backend Engineers |
| 7. Geocoding Service | Geocoding workflow | Backend Engineers |
| 8. Scoring Timeline | Progress Gantt chart | Project Managers |

---

**Created:** 2026-01-31 05:29 JST  
**Format:** Mermaid (Markdown)  
**Total Diagrams:** 8  
**Maintenance:** Update as architecture evolves

---

*"A picture is worth a thousand words. A diagram is worth a thousand lines of code."*

**🎨 Visual documentation complete!**
