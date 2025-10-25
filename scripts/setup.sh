#!/bin/bash

echo "🎭 EchoSelf Setup Script"
echo "========================"
echo ""

# Check Node.js
echo "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18 or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi
echo "✅ Dependencies installed"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Created .env file"
        echo "⚠️  IMPORTANT: Please edit .env and add your API keys!"
    else
        echo "❌ .env.example not found"
    fi
else
    echo "✅ .env file exists"
fi
echo ""

# Setup Prisma
echo "🗄️  Setting up database..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

npx prisma db push
if [ $? -ne 0 ]; then
    echo "❌ Failed to initialize database"
    exit 1
fi
echo "✅ Database setup complete"
echo ""

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p public/uploads
echo "✅ Uploads directory created"
echo ""

# Check ChromaDB (optional)
echo "🧊 Checking ChromaDB (optional)..."
if command -v docker &> /dev/null; then
    echo "Docker is available. You can run ChromaDB with:"
    echo "  docker run -d -p 8000:8000 chromadb/chroma"
else
    echo "⚠️  Docker not found. ChromaDB is optional but recommended."
    echo "   Install from: https://www.docker.com/"
fi
echo ""

# Final checklist
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Edit .env and add your API keys:"
echo "   - FISH_AUDIO_API_KEY"
echo "   - ANTHROPIC_API_KEY"
echo ""
echo "2. (Optional) Start ChromaDB:"
echo "   docker run -d -p 8000:8000 chromadb/chroma"
echo ""
echo "3. Start development server:"
echo "   npm run dev"
echo ""
echo "4. Open http://localhost:3000"
echo ""
echo "📚 For detailed instructions, see SETUP.md"
echo "🚀 Happy hacking!"

