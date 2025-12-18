#!/bin/bash

echo "💰 Budget AI - Setup Script"
echo "============================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Python and Node.js found"
echo ""

# Setup backend
echo "📦 Setting up backend..."
cd backend
python3 -m pip install -r requirements.txt
cd ..

# Setup frontend
echo "📦 Setting up frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "To run the app:"
echo "1. Start backend: cd backend && python3 app.py"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000 in your browser"

