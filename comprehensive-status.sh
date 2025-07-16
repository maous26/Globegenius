#!/bin/bash

# Comprehensive CI/CD Pipeline Status Monitor
# This script provides a complete overview of the pipeline state

echo "📊 CI/CD Pipeline Status Monitor"
echo "================================="
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Repository Information:"
echo "------------------------"
echo "📂 Repository: $(basename $(pwd))"
echo "🌿 Current Branch: $(git branch --show-current)"
echo "📝 Last Commit: $(git log -1 --pretty=format:'%h - %s (%cr)' --abbrev-commit)"
echo "🔗 Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote configured')"
echo ""

# Check GitHub CLI availability
if command -v gh &> /dev/null; then
    echo "📈 GitHub Actions Status:"
    echo "------------------------"
    
    # Get recent runs
    echo "🔄 Recent Pipeline Runs:"
    gh run list --limit 5 --json status,conclusion,displayTitle,createdAt --template '{{range .}}{{printf "  %s %s - %s (%s)\n" (if eq .status "completed") (if eq .conclusion "success") "✅" (if eq .conclusion "failure") "❌" "⚠️") "🔄" .displayTitle .createdAt}}{{end}}'
    
    echo ""
    echo "🎯 Current Pipeline Status:"
    LATEST_RUN=$(gh run list --limit 1 --json databaseId,status,conclusion,displayTitle --jq '.[0]')
    if [ "$LATEST_RUN" != "null" ]; then
        STATUS=$(echo $LATEST_RUN | jq -r '.status')
        CONCLUSION=$(echo $LATEST_RUN | jq -r '.conclusion')
        TITLE=$(echo $LATEST_RUN | jq -r '.displayTitle')
        
        if [ "$STATUS" = "completed" ]; then
            if [ "$CONCLUSION" = "success" ]; then
                echo -e "  ${GREEN}✅ PASSED${NC} - $TITLE"
            else
                echo -e "  ${RED}❌ FAILED${NC} - $TITLE"
            fi
        else
            echo -e "  ${YELLOW}🔄 RUNNING${NC} - $TITLE"
        fi
    fi
    
    echo ""
else
    echo "⚠️ GitHub CLI not available. Install with: brew install gh"
    echo ""
fi

# Check workflow files
echo "⚙️ Workflow Configuration:"
echo "-------------------------"
WORKFLOW_DIR=".github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
    echo "📁 Workflow Files:"
    for file in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo "  📄 $filename"
        fi
    done
    echo ""
else
    echo "❌ No .github/workflows directory found"
    echo ""
fi

# Check Docker configuration
echo "🐳 Docker Configuration:"
echo "------------------------"
DOCKER_FILES=("Dockerfile" "docker-compose.yml" "docker-compose.dev.yml" "docker-compose.prod.yml")
for file in "${DOCKER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file (missing)"
    fi
done

# Check service-specific Dockerfiles
SERVICES=("backend" "frontend" "ml")
for service in "${SERVICES[@]}"; do
    if [ -f "$service/Dockerfile" ]; then
        echo -e "  ${GREEN}✅${NC} $service/Dockerfile"
    else
        echo -e "  ${RED}❌${NC} $service/Dockerfile (missing)"
    fi
done
echo ""

# Check package.json and dependencies
echo "📦 Dependencies Status:"
echo "----------------------"
PACKAGE_DIRS=("." "backend" "frontend")
for dir in "${PACKAGE_DIRS[@]}"; do
    if [ -f "$dir/package.json" ]; then
        echo -e "  ${GREEN}✅${NC} $dir/package.json"
        if [ -f "$dir/package-lock.json" ]; then
            echo -e "  ${GREEN}✅${NC} $dir/package-lock.json"
        else
            echo -e "  ${YELLOW}⚠️${NC} $dir/package-lock.json (missing - may cause cache issues)"
        fi
    fi
done

# Check Python dependencies
if [ -f "ml/requirements.txt" ]; then
    echo -e "  ${GREEN}✅${NC} ml/requirements.txt"
else
    echo -e "  ${RED}❌${NC} ml/requirements.txt (missing)"
fi
echo ""

# Check test files
echo "🧪 Test Configuration:"
echo "---------------------"
TEST_FILES=("backend/src/index.test.ts" "frontend/src/App.test.tsx" "ml/test_app.py")
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file (missing)"
    fi
done
echo ""

# Check environment files
echo "🔧 Environment Configuration:"
echo "-----------------------------"
ENV_FILES=(".env" ".env.example" ".env.github-secrets")
for file in "${ENV_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file (missing)"
    fi
done
echo ""

# Check CI/CD scripts
echo "📜 CI/CD Scripts:"
echo "----------------"
SCRIPT_FILES=("setup-cicd.sh" "test-cicd-pipeline.sh" "generate-secrets.sh" "scripts/deploy.sh")
for file in "${SCRIPT_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✅${NC} $file"
    else
        echo -e "  ${RED}❌${NC} $file (missing)"
    fi
done
echo ""

# Show next steps
echo "🎯 Next Steps:"
echo "-------------"
echo "1. Check the latest pipeline run: gh run view"
echo "2. View detailed logs: gh run view --log"
echo "3. Re-run failed jobs: gh run rerun"
echo "4. Monitor in browser: gh run view --web"
echo "5. Check this status: ./comprehensive-status.sh"
echo ""

echo "📝 Quick Commands:"
echo "-----------------"
echo "• View latest run: gh run view"
echo "• List all runs: gh run list"
echo "• Cancel running job: gh run cancel"
echo "• Trigger workflow: git push origin main"
echo "• Check repository: gh repo view --web"
echo ""

echo "✅ Status check completed!"
echo "📊 CI/CD Pipeline Overview: $(date)"
echo "================================="
