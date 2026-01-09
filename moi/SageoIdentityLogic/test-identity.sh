#!/bin/bash
# test-identity.sh - Runs the full SageoIdentityLogic test suite

set -e  # Exit on any error

echo "=========================================="
echo "SageoIdentityLogic Test Suite"
echo "=========================================="
echo ""

# Step 1: Compile the logic
echo "📦 Compiling SageoIdentityLogic..."
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
coco lab init < test_complete.txt

echo ""
echo "=========================================="
echo "Test suite completed!"
echo "=========================================="
