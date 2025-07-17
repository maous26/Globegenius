#!/bin/bash

# GlobeGenius Development Status Checker
# Run this script to check if all services are running

echo "🔍 GlobeGenius Development Status Check"
echo "======================================"

# Check Docker containers
echo "📦 Docker Containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep globegenius || echo "❌ No Docker containers running"

echo ""

# Check Backend API
echo "🔧 Backend API (http://localhost:3000):"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend API is running"
    curl -s http://localhost:3000/health | jq . 2>/dev/null || echo "  Response received"
else
    echo "❌ Backend API is not running"
fi

echo ""

# Check Frontend
echo "🌐 Frontend (http://localhost:5173):"
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not running"
fi

echo ""

# Check ML Service
echo "🤖 ML Service (http://localhost:8000):"
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo "✅ ML Service is running"
    curl -s http://localhost:8000 | jq . 2>/dev/null || echo "  Response received"
else
    echo "❌ ML Service is not running"
fi

echo ""

# Check Database
echo "🗄️  Database (localhost:5432):"
if docker exec globegenius-postgres pg_isready -U globegenius > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "❌ PostgreSQL is not ready"
fi

echo ""

# Check Redis
echo "⚡ Redis (localhost:6379):"
if docker exec globegenius-redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "❌ Redis is not running"
fi

echo ""

# Check running processes
echo "🔄 Node.js Processes:"
ps aux | grep -E "(nodemon|vite)" | grep -v grep | awk '{print $2, $11, $12, $13, $14, $15}' || echo "❌ No Node.js dev processes running"

echo ""

# Check Python processes
echo "🐍 Python Processes:"
ps aux | grep -E "(uvicorn|python)" | grep -v grep | awk '{print $2, $11, $12, $13, $14, $15}' || echo "❌ No Python processes running"

echo ""

# Summary
echo "📊 Quick Start Commands:"
echo "========================"
echo "Start Database:  docker-compose -f docker-compose.dev.yml up -d postgres redis"
echo "Start Backend:   cd backend && npm run dev"
echo "Start Frontend:  cd frontend && npm run dev"
echo "Start ML:        cd ml && source venv/bin/activate && uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000"

echo ""
echo "🌐 Application URLs:"
echo "==================="
echo "Frontend:     http://localhost:5173"
echo "Backend API:  http://localhost:3000"
echo "ML Service:   http://localhost:8000"
echo "API Docs:     http://localhost:3000/api-docs"
echo "ML Docs:      http://localhost:8000/docs"

echo ""
echo "✅ Status check complete!"
