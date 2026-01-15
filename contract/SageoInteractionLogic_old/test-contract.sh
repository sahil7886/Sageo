#!/bin/bash
# test-contract.sh - Runs the full SageoInteractionLogic test suite

set -e  # Exit on any error

echo "=========================================="
echo "SageoInteractionLogic Test Suite"
echo "=========================================="
echo ""

# Step 1: Compile the logic
echo "📦 Compiling SageoInteractionLogic..."
coco compile .
if [ $? -ne 0 ]; then
    echo "❌ Compilation failed!"
    exit 1
fi
echo "✅ Compilation successful"
echo ""

# Step 2: Run the test commands
echo "🧪 Running test suite..."
echo ""

# Run the lab with the test commands piped in
coco lab init < full_test.txt

echo ""
echo "=========================================="
echo "Test suite completed!"
echo "=========================================="
