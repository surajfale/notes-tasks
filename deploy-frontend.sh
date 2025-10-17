#!/bin/bash
# Deploy Frontend to Netlify
# Usage: ./deploy-frontend.sh https://your-backend-url.up.railway.app

if [ -z "$1" ]; then
    echo "❌ Error: Backend URL is required"
    echo "Usage: ./deploy-frontend.sh https://your-backend-url.up.railway.app"
    exit 1
fi

BACKEND_URL=$1
API_URL="$BACKEND_URL/api"

echo "🚀 Building Flutter web app..."
echo "📡 API URL: $API_URL"

cd frontend

# Build for production
flutter build web --release --dart-define=API_BASE_URL=$API_URL --dart-define=DEVELOPMENT=false

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📦 Next steps:"
    echo "1. Go to https://app.netlify.com/drop"
    echo "2. Drag the 'frontend/build/web' folder to deploy"
    echo ""
    echo "Or use Netlify CLI:"
    echo "   npm install -g netlify-cli"
    echo "   netlify deploy --prod --dir=build/web"
else
    echo ""
    echo "❌ Build failed!"
    exit 1
fi

cd ..
