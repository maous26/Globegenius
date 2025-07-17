#!/bin/bash

# GlobeGenius Application Stack Status Report
# Generated: $(date)

echo "🌟 GlobeGenius Application Stack Status Report"
echo "============================================="
echo

# Service Status
echo "📊 Service Status:"
echo "=================="

# Backend Service
echo "🚀 Backend API:"
if curl -s http://localhost:3000/health > /dev/null; then
    echo "   ✅ Status: RUNNING"
    echo "   🔗 URL: http://localhost:3000"
    echo "   📋 Health: $(curl -s http://localhost:3000/health | jq -r '.status')"
else
    echo "   ❌ Status: DOWN"
fi

# Frontend Service  
echo "🎨 Frontend:"
if curl -s http://localhost:5174 > /dev/null; then
    echo "   ✅ Status: RUNNING"
    echo "   🔗 URL: http://localhost:5174"
    echo "   🛠️ Technology: React + Vite"
else
    echo "   ❌ Status: DOWN"
fi

# ML Service
echo "🧠 ML Service:"
if curl -s http://localhost:8000/health > /dev/null; then
    echo "   ✅ Status: RUNNING"  
    echo "   🔗 URL: http://localhost:8000"
    echo "   📋 Health: $(curl -s http://localhost:8000/health | jq -r '.status')"
else
    echo "   ❌ Status: DOWN"
fi

# Database Services
echo "🗄️ Database Services:"
if docker ps | grep -q "globegenius-postgres"; then
    echo "   ✅ PostgreSQL: RUNNING"
    echo "   🔗 Port: 5432"
    echo "   🐳 Container: globegenius-postgres"
else
    echo "   ❌ PostgreSQL: DOWN"
fi

if docker ps | grep -q "globegenius-redis"; then
    echo "   ✅ Redis: RUNNING"
    echo "   🔗 Port: 6379"
    echo "   🐳 Container: globegenius-redis"
else
    echo "   ❌ Redis: DOWN"
fi

echo
echo "🔧 Technical Details:"
echo "==================="
echo "Backend: Node.js + TypeScript + Express"
echo "Frontend: React + TypeScript + Vite + Tailwind CSS"
echo "ML Service: Python + FastAPI + uvicorn"
echo "Database: PostgreSQL 15 + Redis 7"
echo "Environment: Development"

echo
echo "📝 Notes:"
echo "========="
echo "• Backend API routes are currently in simplified mode"
echo "• Frontend created with main.tsx entry point"
echo "• All services are containerized with Docker"
echo "• Database uses trust authentication for development"
echo "• TypeScript compilation errors have been resolved"

echo
echo "🎯 Next Steps:"
echo "=============="
echo "1. Enable full API routes in backend"
echo "2. Complete database schema migration"
echo "3. Test frontend-backend communication"
echo "4. Configure production environment"
echo "5. Set up monitoring and logging"
