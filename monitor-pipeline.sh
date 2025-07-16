#!/bin/bash

# Monitor CI/CD Pipeline Status
echo "🔍 Monitoring GlobeGenius CI/CD Pipeline"
echo "========================================"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed"
    echo "   Install with: brew install gh"
    echo "   Or check status manually at: https://github.com/maous26/Globegenius/actions"
    exit 1
fi

# Check if user is logged in to GitHub CLI
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged in to GitHub CLI"
    echo "   Run: gh auth login"
    echo "   Or check status manually at: https://github.com/maous26/Globegenius/actions"
    exit 1
fi

echo "📊 Recent Pipeline Runs:"
echo "========================"

# Get recent workflow runs
gh run list --limit 5 --repo maous26/Globegenius

echo ""
echo "🔄 Current Pipeline Status:"
echo "============================"

# Get the status of the most recent run
LATEST_RUN=$(gh run list --limit 1 --json status,conclusion,workflowName,createdAt --repo maous26/Globegenius)

if [ -n "$LATEST_RUN" ] && [ "$LATEST_RUN" != "[]" ]; then
    echo "$LATEST_RUN" | jq -r '.[] | "Workflow: \(.workflowName)\nStatus: \(.status)\nConclusion: \(.conclusion // "running")\nCreated: \(.createdAt)"'
else
    echo "No recent pipeline runs found"
fi

echo ""
echo "🌐 GitHub Actions URL:"
echo "https://github.com/maous26/Globegenius/actions"

echo ""
echo "💡 Commands to monitor:"
echo "======================="
echo "Watch live: gh run watch"
echo "View logs: gh run view --log"
echo "List runs: gh run list"
echo "Manual check: open https://github.com/maous26/Globegenius/actions"
