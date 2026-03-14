#!/bin/bash
# Career AI - Quick Setup Script

set -e

echo ""
echo "========================================"
echo "   🎯 CAREER AI - SETUP SCRIPT"
echo "========================================"
echo ""
echo "✨ Features included:"
echo "   • AI Career Assessment Quiz"
echo "   • Personalized Career Roadmaps"
echo "   • Resume Analysis with AI"
echo "   • Community & Peer Learning"
echo "   • Study Rooms & Challenges"
echo "   • Discussion Forums & Messaging"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi
echo "✅ Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi
echo "✅ Node.js found: $(node --version)"

echo ""
echo "--- Setting up Backend ---"
cd backend

# Virtual environment
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate

# Install deps
echo "Installing Python dependencies..."
pip install -r requirements.txt -q

# Setup env
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created backend/.env - Add your ANTHROPIC_API_KEY for AI resume analysis"
fi

# Train model
if [ ! -f "models/career_rf_model.pkl" ]; then
    echo ""
    echo "--- Training ML Models (first time) ---"
    cd data
    python generate_dataset.py
    python train_model.py
    cd ..
fi
echo "✅ Backend ready"

echo ""
echo "--- Setting up Frontend ---"
cd ../frontend

# Install npm deps
if [ ! -d "node_modules" ]; then
    echo "Installing npm packages..."
    npm install --silent
fi

if [ ! -f ".env" ]; then
    cp .env.example .env
fi
echo "✅ Frontend ready"

echo ""
echo "========================================"
echo "   🚀 LAUNCH INSTRUCTIONS"
echo "========================================"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "For AI resume analysis, add your"
echo "Anthropic API key to backend/.env"
echo "========================================"
