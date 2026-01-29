#!/bin/bash
# install-metrics-server.sh - Install and configure metrics-server for kind cluster
# Execute: bash k8s/scripts/install-metrics-server.sh

set -e

echo "📊 Installing metrics-server for Kubernetes monitoring..."
echo ""

# Step 1: Install metrics-server
echo "📥 Step 1: Deploying metrics-server..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo "   ✅ Metrics server manifest applied"
echo ""

# Step 2: Patch for kind cluster (allow insecure TLS)
echo "🔧 Step 2: Patching metrics-server for kind cluster compatibility..."

kubectl patch deployment metrics-server -n kube-system --type='json' \
  -p='[
    {
      "op": "add",
      "path": "/spec/template/spec/containers/0/args/-",
      "value": "--kubelet-insecure-tls"
    },
    {
      "op": "add",
      "path": "/spec/template/spec/containers/0/args/-",
      "value": "--kubelet-preferred-address-types=InternalIP,ExternalIP,Hostname"
    }
  ]'

echo "   ✅ Metrics server patched for kind cluster"
echo ""

# Step 3: Wait for metrics-server to be ready
echo "⏳ Step 3: Waiting for metrics-server to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/metrics-server -n kube-system

echo "   ✅ Metrics server is ready"
echo ""

# Step 4: Verify metrics collection
echo "🔍 Step 4: Verifying metrics collection..."
echo "   Waiting 15 seconds for initial metrics collection..."
sleep 15

echo ""
echo "📈 Node Metrics:"
kubectl top nodes || echo "   ⚠️  Metrics not yet available, wait a few more seconds and retry"

echo ""
echo "📈 Pod Metrics (zenith-lite namespace):"
kubectl top pods -n zenith-lite || echo "   ⚠️  Metrics not yet available, wait a few more seconds and retry"

echo ""
echo "✅ Metrics server installation complete!"
echo ""
echo "Available commands:"
echo "  kubectl top nodes           # View node resource usage"
echo "  kubectl top pods --all-namespaces    # View pod resource usage"
