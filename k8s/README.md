# Kubernetes Infrastructure - Tiered Topology

This directory contains the Kubernetes manifests and scripts to deploy the Zenith Lite application with a future-proof tiered topology.

## Directory Structure

```
k8s/
├── CAPACITY_ANALYSIS.md          # Comprehensive capacity planning report
├── README.md                      # This file
├── manifests/                     # Kubernetes manifests
│   ├── backend-deployment.yaml    # Backend with compute tier affinity
│   ├── frontend-deployment.yaml   # Frontend with edge tier affinity
│   ├── postgres-deployment.yaml   # Postgres with data tier affinity
│   ├── nginx-deployment.yaml      # Nginx with edge tier affinity
│   └── hpa.yaml                   # Horizontal Pod Autoscalers
└── scripts/                       # Automation scripts
    ├── label-nodes.sh             # Apply node labels and taints
    ├── apply-topology.sh          # Apply complete topology
    ├── rollback-topology.sh       # Remove topology configuration
    └── install-metrics-server.sh  # Install metrics-server for monitoring
```

## Quick Start

### Prerequisites

- `kubectl` configured and connected to your kind cluster
- Cluster with 9 worker nodes (desktop-worker through desktop-worker9)
- 5-10 minutes for deployment

### 1. Read the Capacity Analysis

```bash
cat k8s/CAPACITY_ANALYSIS.md
```

This report provides:

- Current cluster state analysis
- Future scenario simulations
- Proposed topology strategy
- Resilience scoring (before: 23/100, after: 85/100)

### 2. Install Metrics Server (Optional but Recommended)

```bash
bash k8s/scripts/install-metrics-server.sh
```

This enables `kubectl top nodes` and `kubectl top pods` for resource monitoring.

### 3. Apply Tiered Topology

```bash
bash k8s/scripts/apply-topology.sh
```

This will:

1. Label and taint all nodes according to their tier
2. Delete existing deployments
3. Apply new deployments with affinity rules
4. Wait for rollouts to complete
5. Verify pod distribution

**Expected Result:**

- Backend: 3 replicas on worker4, worker6, worker7 (COMPUTE tier)
- Frontend: 2 replicas on worker, worker9 (EDGE tier)
- Postgres: 1 replica on worker2 (DATA tier)
- Nginx: 2 replicas on worker5, worker9 (EDGE tier)

### 4. Enable Autoscaling (Optional)

```bash
kubectl apply -f k8s/manifests/hpa.yaml
```

This configures:

- Backend: 3-10 replicas (scale at 70% CPU, 80% memory)
- Frontend: 2-5 replicas (scale at 75% CPU, 85% memory)

### 5. Verify Deployment

```bash
# Check node labels
kubectl get nodes --show-labels | grep workload-tier

# Check pod distribution
kubectl get pods -n zenith-lite -o wide

# Check resource usage (requires metrics-server)
kubectl top nodes
kubectl top pods -n zenith-lite

# Check HPA status (if enabled)
kubectl get hpa -n zenith-lite
```

### 6. Redeploy (Update App Code)

When you have made changes to the backend or frontend code:

```bash
# Builds images, loads into cluster, and performs rolling restart
bash k8s/scripts/redeploy.sh
```

## Tiered Topology Overview

### Tier 1: Data Sanctuary

- **Nodes:** desktop-worker2, desktop-worker3
- **Purpose:** Stateful workloads (databases, caches)
- **Label:** `workload-tier=data`
- **Taint:** `workload-tier=data:NoSchedule`

### Tier 2: Compute Grid

- **Nodes:** desktop-worker4, desktop-worker6, desktop-worker7, desktop-worker8
- **Purpose:** Stateless application logic (backend, batch jobs)
- **Label:** `workload-tier=compute`
- **Taint:** `workload-tier=compute:NoSchedule`

### Tier 3: Edge/DMZ

- **Nodes:** desktop-worker, desktop-worker5, desktop-worker9
- **Purpose:** Frontend and ingress (nginx, React app)
- **Label:** `workload-tier=edge`
- **Taint:** `workload-tier=edge:NoSchedule`

## Benefits

✅ **Eliminates Single Point of Failure** - Backend spreads across 3 nodes  
✅ **Prevents Resource Contention** - Database isolated from compute workloads  
✅ **Enables Horizontal Scaling** - 4 compute nodes for burst capacity  
✅ **Improves Resilience** - Score increases from 23/100 to 85/100  
✅ **Future-Proof** - Ready for 50-replica reconciliation jobs  

## Rollback

If you need to undo the tiered topology:

```bash
bash k8s/scripts/rollback-topology.sh
```

This removes all labels, taints, and restarts deployments to allow normal scheduling.

## Troubleshooting

### Pods stuck in Pending state

**Cause:** Pod cannot find a node matching its affinity rules

**Fix:**

```bash
# Check pod events
kubectl describe pod <pod-name> -n zenith-lite

# Verify node labels
kubectl get nodes --show-labels | grep workload-tier

# Ensure tolerations are set in deployment
kubectl get deployment <deployment-name> -n zenith-lite -o yaml | grep -A 5 tolerations
```

### Metrics not available

**Cause:** Metrics server not installed or not ready

**Fix:**

```bash
# Install metrics server
bash k8s/scripts/install-metrics-server.sh

# Check metrics server status
kubectl get deployment metrics-server -n kube-system

# Wait 60 seconds then retry
kubectl top nodes
```

### Backend pod keeps restarting

**Cause:** Insufficient resources or database connection issues

**Fix:**

```bash
# Check pod logs
kubectl logs <backend-pod> -n zenith-lite

# Check resource limits
kubectl describe pod <backend-pod> -n zenith-lite | grep -A 5 "Limits"

# Verify database is ready
kubectl get pods -n zenith-lite | grep postgres
```

## Next Steps for 95/100 Resilience

1. **Add PostgreSQL Read Replica** (worker3)
2. **Configure PodDisruptionBudgets** for zero-downtime updates
3. **Implement Resource Quotas** per namespace
4. **Add Network Policies** for tier isolation
5. **Configure Persistent Volume Snapshots** for data backup

## References

- [Capacity Analysis](./CAPACITY_ANALYSIS.md) - Full predictive allocation report
- [Kubernetes Affinity](https://kubernetes.io/docs/concepts/scheduling-eviction/assign-pod-node/)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
