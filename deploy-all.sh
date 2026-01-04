#!/bin/bash

echo "🚀 Deploying WordSnap AI - Full Stack Deployment"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command succeeded
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1 successful!${NC}"
    else
        echo -e "${RED}❌ $1 failed!${NC}"
        exit 1
    fi
}

# Deploy Backend
echo -e "\n${YELLOW}📡 Step 1: Deploying Backend...${NC}"
cd ~/Github/wordsnap-ai/backend

gcloud run deploy wordsnap-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,GCP_PROJECT_ID=wordsnap-ai,GCP_REGION=us-central1,GCS_BUCKET_NAME=wordsnap-ai-products,VERTEX_AI_LOCATION=us-central1,VERTEX_AI_MODEL=gemini-2.5-flash,RATE_LIMIT_WINDOW_MS=900000,RATE_LIMIT_MAX_REQUESTS=100,CORS_ORIGIN=https://wordsnap-frontend-763810149974.us-central1.run.app" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --project wordsnap-ai

check_status "Backend deployment"

# Deploy Frontend
echo -e "\n${YELLOW}🎨 Step 2: Deploying Frontend...${NC}"
cd ~/Github/wordsnap-ai/frontend

# Clean build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build
echo "📦 Building production bundle..."
npm run build
check_status "Frontend build"

# Deploy
gcloud run deploy wordsnap-frontend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 256Mi \
  --cpu 1 \
  --max-instances 5 \
  --min-instances 0 \
  --project wordsnap-ai

check_status "Frontend deployment"

# Summary
echo -e "\n${GREEN}=================================================="
echo "✅ Full Stack Deployment Complete!"
echo "==================================================${NC}"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: https://wordsnap-frontend-763810149974.us-central1.run.app"
echo "   Backend:  https://wordsnap-backend-763810149974.us-central1.run.app"
echo "   Health:   https://wordsnap-backend-763810149974.us-central1.run.app/health"
echo ""
echo "📊 Next Steps:"
echo "   1. Test the application in browser"
echo "   2. Check Cloud Run logs: gcloud run services logs read wordsnap-backend --region us-central1"
echo "   3. Monitor costs: https://console.cloud.google.com/billing"
echo ""