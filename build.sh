#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting build process..."

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Generate synthetic data if it doesn't exist
echo "🔬 Generating synthetic data..."
python data_generator.py

# Train the model if it doesn't exist
echo "🧠 Training ML model..."
python model_trainer.py

echo "✅ Build completed successfully!"