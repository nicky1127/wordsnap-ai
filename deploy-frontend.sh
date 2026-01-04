#!/bin/bash

echo "🚀 Deploying WordSnap AI Frontend..."

cd ~/Github/wordsnap-ai/frontend

# Clean build
echo "🧹 Cleaning previous build..."
rm -rf dist

# Build
echo "📦 Building production bundle..."
npm run build

# Deploy
echo "☁️  Deploying to Cloud Run..."
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

echo "✅ Deployment complete!"
echo "🌐 URL: https://wordsnap-frontend-763810149974.us-central1.run.app"