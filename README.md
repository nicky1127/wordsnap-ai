# WordSnap AI

**Tagline:** Snap a pic. Get pro copy.

AI-powered product description generator for e-commerce sellers, dropshippers, and marketing agencies.

## Features

- 🖼️ **Multi-Image Upload** - Upload 2-5 product images from different angles
- 🤖 **AI-Powered Generation** - Powered by Google Gemini 1.5
- 📝 **Multiple Formats** - Short, medium, and long descriptions
- 🎨 **Tone Options** - Professional, casual, or luxury writing styles
- 🔍 **Image Analysis** - AI insights before generating descriptions
- 📋 **Copy & Export** - One-click copy to clipboard or export as JSON
- 📊 **Usage Tracking** - Monitor your monthly generation quota
- 🌙 **Dark Mode** - Beautiful dark/light theme support
- 📱 **Responsive** - Works on desktop, tablet, and mobile

## Tech Stack

### Frontend

- React 18 + Vite 5
- React Router v6
- Tailwind CSS + shadcn/ui
- Zustand (state management)
- Axios (API calls)

### Backend

- Node.js 20 + Express.js
- Google Cloud Vertex AI (Gemini)
- Cloud Storage (image storage)
- Firestore (database)
- Multer (file uploads)

### Infrastructure

- Google Cloud Platform
- Region: us-central1 (cost-optimized)
- Authentication: Firebase Auth (Phase 4)
- Payments: Stripe (Phase 5)

## Project Structure

```
wordsnap-ai/
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── pages/      # Page components
│   │   ├── lib/        # Utilities & API
│   │   └── store/      # Zustand store
│   └── package.json
│
├── backend/            # Node.js Express API
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   ├── middleware/ # Auth, rate limiting
│   │   └── config/     # Configuration
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- GCP account with billing enabled
- gcloud CLI installed

### Backend Setup

1. **Install dependencies:**

```bash
cd backend
npm install
```

2. **Configure environment:**

```bash
cp .env.example .env
# Edit .env with your GCP credentials
```

3. **Start development server:**

```bash
npm run dev
```

Backend runs at `http://localhost:8080`

### Frontend Setup

1. **Install dependencies:**

```bash
cd frontend
npm install
```

2. **Start development server:**

```bash
npm run dev
```

Frontend runs at `http://localhost:5173`

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=8080
NODE_ENV=development

# GCP
GCP_PROJECT_ID=wordsnap-ai
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json

# Cloud Storage
GCS_BUCKET_NAME=wordsnap-ai-products

# Vertex AI
VERTEX_AI_LOCATION=us-central1
VERTEX_AI_MODEL=gemini-pro

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_NAME=WordSnap AI
VITE_APP_TAGLINE=Snap a pic. Get pro copy.
```

## API Endpoints

### Generate Description

```
POST /api/generate
Content-Type: multipart/form-data

Body:
- images: File[] (2-5 images)
- productName: string
- category: string (optional)
- specs: string (optional)
- tone: 'professional' | 'casual' | 'luxury'
```

### Analyze Image

```
POST /api/generate/analyze
Content-Type: multipart/form-data

Body:
- image: File
```

### Get History

```
GET /api/generate/history?limit=20
```

### Get Usage Stats

```
GET /api/generate/usage/stats
```

## Pricing Tiers (Planned)

- **Free**: 10 products/month
- **Starter** ($19/mo): 200 products/month
- **Growth** ($79/mo): 1,000 products/month + API access
- **Agency** ($299/mo): Unlimited + white-label

## Roadmap

- [x] Phase 1: GCP Setup
- [x] Phase 2: Backend API + Vertex AI
- [x] Phase 3: Frontend Dashboard
- [ ] Phase 4: Authentication (Firebase)
- [ ] Phase 5: Stripe Payments
- [ ] Phase 6: Production Deployment

## Development Costs

**Current monthly cost:** ~$5-15 (development)

- Vertex AI: ~$0.10-0.50
- Cloud Storage: ~$0.01
- Firestore: ~$0.01
- Cloud Run: Free tier

## Contributing

This is a personal project. Not currently accepting contributions.

## License

Private - All Rights Reserved

## Author

Built with ❤️ by Nicky
