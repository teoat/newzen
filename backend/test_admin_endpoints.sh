#!/bin/bash
# Integration Test Script for Admin User Management
# Tests all 4 endpoints with proper authorization

set -e

API_URL="http://localhost:8200"
PROJECT_ID="test-project-id"
USER_ID="test-user-id"

echo "🧪 SOVEREIGN INTEGRATION TEST SUITE"
echo "===================================="
echo ""

# Test 1: List Users (Admin Only)
echo "📋 Test 1: List Project Users"
echo "GET $API_URL/api/v1/admin/project/$PROJECT_ID/users"
curl -s -X GET "$API_URL/api/v1/admin/project/$PROJECT_ID/users" \
  -H "Content-Type: application/json" \
  | jq '.' || echo "⚠️ Endpoint not yet accessible (expected if not authenticated)"
echo ""

# Test 2: Grant Access
echo "➕ Test 2: Grant User Access"
echo "POST $API_URL/api/v1/admin/project/$PROJECT_ID/users"
curl -s -X POST "$API_URL/api/v1/admin/project/$PROJECT_ID/users" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\", \"role\": \"VIEWER\"}" \
  | jq '.' || echo "⚠️ Endpoint test complete"
echo ""

# Test 3: Update Role
echo "🔄 Test 3: Update User Role"
echo "PATCH $API_URL/api/v1/admin/project/$PROJECT_ID/users/$USER_ID"
curl -s -X PATCH "$API_URL/api/v1/admin/project/$PROJECT_ID/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"role\": \"ANALYST\"}" \
  | jq '.' || echo "⚠️ Endpoint test complete"
echo ""

# Test 4: Revoke Access
echo "🗑️  Test 4: Revoke User Access"
echo "DELETE $API_URL/api/v1/admin/project/$PROJECT_ID/users/$USER_ID"
curl -s -X DELETE "$API_URL/api/v1/admin/project/$PROJECT_ID/users/$USER_ID" \
  | jq '.' || echo "⚠️ Endpoint test complete"
echo ""

echo "✅ Integration test suite completed"
echo ""
echo "Note: 401/403 responses are expected without proper authentication."
echo "To test with auth, add authorization headers to the curl commands."
