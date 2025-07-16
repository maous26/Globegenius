#!/bin/bash

# Fix GitHub Actions workflow cache issues

echo "🔧 Fixing GitHub Actions workflow cache issues..."

# Replace all cache: 'npm' references
sed -i '' 's/cache: '\''npm'\''//g' /Users/moussa/globegenius/.github/workflows/ci-cd.yml

# Replace all cache: 'pip' references
sed -i '' 's/cache: '\''pip'\''//g' /Users/moussa/globegenius/.github/workflows/ci-cd.yml

echo "✅ GitHub Actions workflow cache issues fixed!"
echo "📝 Removed cache configurations to avoid lockfile dependency issues"
