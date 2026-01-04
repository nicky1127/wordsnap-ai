#!/bin/bash

echo "🚀 Deploying WordSnap AI Backend..."

cd ~/Github/wordsnap-ai/backend

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the backend directory?"
    exit 1
fi

# Install dependencies (optional - uncomment if needed)
# echo "📦 Installing dependencies..."
# npm install

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
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

if [ $? -eq 0 ]; then
    echo "✅ Backend deployment complete!"
    echo "🌐 Backend URL: https://wordsnap-backend-763810149974.us-central1.run.app"
    echo "🔍 Health check: https://wordsnap-backend-763810149974.us-central1.run.app/health"
else
    echo "❌ Deployment failed!"
    exit 1
fi