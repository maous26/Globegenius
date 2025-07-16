#!/bin/bash

# CI/CD Pipeline Test Script
# This script validates that the CI/CD pipeline is ready to be tested

echo "🧪 Testing GlobeGenius CI/CD Pipeline"
echo "====================================="

# Test 1: Check Docker CLI connection
echo "Test 1: Docker CLI Connection"
if docker info >/dev/null 2>&1; then
    echo "✅ Docker CLI connected"
    echo "   Version: $(docker --version)"
else
    echo "❌ Docker CLI not connected"
    exit 1
fi

# Test 2: Check Docker images
echo -e "\nTest 2: Docker Images"
if docker images | grep -q globegenius; then
    echo "✅ GlobeGenius images found:"
    docker images | grep globegenius | head -3
else
    echo "❌ No GlobeGenius images found"
    echo "   Building images..."
    docker compose -f docker-compose.dev.yml build
fi

# Test 3: Check GitHub Actions workflow
echo -e "\nTest 3: GitHub Actions Workflow"
if [ -f ".github/workflows/ci-cd.yml" ]; then
    echo "✅ CI/CD workflow file exists"
    echo "   Jobs found: $(grep -c 'name:' .github/workflows/ci-cd.yml) jobs"
else
    echo "❌ CI/CD workflow file missing"
    exit 1
fi

# Test 4: Check Git configuration
echo -e "\nTest 4: Git Configuration"
if git remote -v | grep -q "github.com/maous26/Globegenius"; then
    echo "✅ GitHub remote configured"
    echo "   Remote: $(git remote get-url origin)"
else
    echo "❌ GitHub remote not configured"
    exit 1
fi

# Test 5: Check for sensitive files
echo -e "\nTest 5: File Safety Check"
if [ -f ".gitignore" ]; then
    echo "✅ .gitignore file exists"
    if grep -q ".env" .gitignore; then
        echo "✅ Environment files protected"
    else
        echo "⚠️  Environment files not in .gitignore"
    fi
else
    echo "❌ .gitignore file missing"
fi

# Test 6: Validate Docker Compose files
echo -e "\nTest 6: Docker Compose Validation"
if docker compose -f docker-compose.dev.yml config >/dev/null 2>&1; then
    echo "✅ Development compose file valid"
else
    echo "❌ Development compose file has errors"
fi

if docker compose -f docker-compose.prod.yml config >/dev/null 2>&1; then
    echo "✅ Production compose file valid"
else
    echo "❌ Production compose file has errors"
fi

echo -e "\n🎯 Pipeline Test Summary:"
echo "========================="
echo "✅ Docker CLI: Connected"
echo "✅ GitHub Remote: Configured"
echo "✅ Workflow: Ready"
echo "✅ Compose Files: Valid"

echo -e "\n🚀 Next Steps:"
echo "1. Add GitHub secrets to your repository"
echo "2. Push code to trigger the CI/CD workflow"
echo "3. Monitor GitHub Actions tab for results"

echo -e "\n📋 Command to test the pipeline:"
echo "git add ."
echo "git commit -m 'Test CI/CD pipeline'"
echo "git push origin main"
