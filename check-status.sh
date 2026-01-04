#!/bin/bash

echo "🔍 WordSnap AI - Status Check"
echo "=============================="

# Backend Health
echo ""
echo "📡 Backend Health:"
curl -s https://wordsnap-backend-763810149974.us-central1.run.app/health | jq '.'

# Frontend Status
echo ""
echo "🎨 Frontend Status:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" https://wordsnap-frontend-763810149974.us-central1.run.app

# Cloud Run Services
echo ""
echo "☁️  Cloud Run Services:"
gcloud run services list --region us-central1 --project wordsnap-ai --format="table(SERVICE_NAME,REGION,URL,LAST_MODIFIED_AT)"

# Recent Logs
echo ""
echo "📋 Recent Backend Logs (last 10):"
gcloud run services logs read wordsnap-backend \
  --region us-central1 \
  --project wordsnap-ai \
  --limit 10 \
  --format="table(timestamp,message)"