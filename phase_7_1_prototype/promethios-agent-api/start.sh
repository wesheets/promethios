#!/bin/bash
echo "🔧 Installing dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo "🚀 Starting API server..."
python src/main.py
