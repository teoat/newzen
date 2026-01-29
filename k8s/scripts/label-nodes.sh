#!/bin/bash
# label-nodes.sh - Apply tiered topology labels and taints
# Execute: bash k8s/scripts/label-nodes.sh

set -e

echo "🎯 Applying Tiered Node Topology..."
echo ""

# ============================================
# TIER 1: DATA SANCTUARY
# ============================================
echo "📊 TIER 1: Data Sanctuary (Stateful Workloads)"
echo "   Nodes: worker2, worker3"
echo "   Purpose: Database, Redis, StatefulSets"
echo ""

kubectl label nodes desktop-worker2 workload-tier=data --overwrite
kubectl label nodes desktop-worker3 workload-tier=data --overwrite

kubectl taint nodes desktop-worker2 workload-tier=data:NoSchedule --overwrite
kubectl taint nodes desktop-worker3 workload-tier=data:NoSchedule --overwrite

echo "   ✅ worker2 labeled and tainted"
echo "   ✅ worker3 labeled and tainted"
echo ""

# ============================================
# TIER 2: COMPUTE GRID
# ============================================
echo "⚡ TIER 2: Compute Grid (Stateless Application Logic)"
echo "   Nodes: worker4, worker6, worker7, worker8"
echo "   Purpose: Backend API, Batch Jobs, Workers"
echo ""

kubectl label nodes desktop-worker4 workload-tier=compute --overwrite
kubectl label nodes desktop-worker6 workload-tier=compute --overwrite
kubectl label nodes desktop-worker7 workload-tier=compute --overwrite
kubectl label nodes desktop-worker8 workload-tier=compute --overwrite

kubectl taint nodes desktop-worker4 workload-tier=compute:NoSchedule --overwrite
kubectl taint nodes desktop-worker6 workload-tier=compute:NoSchedule --overwrite
kubectl taint nodes desktop-worker7 workload-tier=compute:NoSchedule --overwrite
kubectl taint nodes desktop-worker8 workload-tier=compute:NoSchedule --overwrite

echo "   ✅ worker4 labeled and tainted"
echo "   ✅ worker6 labeled and tainted"
echo "   ✅ worker7 labeled and tainted"
echo "   ✅ worker8 labeled and tainted"
echo ""

# ============================================
# TIER 3: DMZ/EDGE
# ============================================
echo "🌐 TIER 3: Edge/DMZ (Frontend & Ingress)"
echo "   Nodes: worker, worker5, worker9"
echo "   Purpose: Nginx, Frontend, API Gateway"
echo ""

kubectl label nodes desktop-worker workload-tier=edge --overwrite
kubectl label nodes desktop-worker5 workload-tier=edge --overwrite
kubectl label nodes desktop-worker9 workload-tier=edge --overwrite

kubectl taint nodes desktop-worker workload-tier=edge:NoSchedule --overwrite
kubectl taint nodes desktop-worker5 workload-tier=edge:NoSchedule --overwrite
kubectl taint nodes desktop-worker9 workload-tier=edge:NoSchedule --overwrite

echo "   ✅ worker labeled and tainted"
echo "   ✅ worker5 labeled and tainted"
echo "   ✅ worker9 labeled and tainted"
echo ""

# ============================================
# VERIFICATION
# ============================================
echo "🔍 Verification - Node Labels:"
kubectl get nodes --show-labels | grep workload-tier

echo ""
echo "✅ Node labeling and tainting complete!"
echo ""
echo "Next Steps:"
echo "  1. Apply deployment manifests: bash k8s/scripts/apply-topology.sh"
echo "  2. Verify pod distribution: kubectl get pods -n zenith-lite -o wide"
