# GlobeGenius Development Guide

## 🚀 Application Status

### Services Running
- **Backend API**: http://localhost:3000
- **Frontend Web App**: http://localhost:5173  
- **ML Service**: http://localhost:8000
- **Database**: PostgreSQL on localhost:5432
- **Cache**: Redis on localhost:6379

### API Endpoints
- Health Check: `GET /health`
- API Documentation: `GET /api-docs`
- Authentication: `POST /api/auth/login`
- User Management: `GET /api/users`
- Flight Alerts: `GET /api/alerts`

## 🛠️ Development Workflow

### Starting the Development Environment

1. **Start Database Services**:
   ```bash
   cd /Users/moussa/globegenius
   docker-compose -f docker-compose.dev.yml up -d postgres redis
   ```

2. **Start Backend API**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Start ML Service**:
   ```bash
   cd ml
   source venv/bin/activate
   uvicorn app_simple:app --reload --host 0.0.0.0 --port 8000
   ```

### Development Commands

```bash
# Backend
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Run linting
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database

# Frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run linting

# ML Service
uvicorn app_simple:app --reload  # Start development server
pytest                           # Run tests
```

## 🔧 Configuration

### Environment Variables
The backend uses environment variables from `.env` file:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secret for JWT tokens
- `TRAVELPAYOUT_TOKEN`: Flight API token
- `FLIGHTLABS_API_KEY`: Flight Labs API key

### Database
- PostgreSQL 15 running in Docker
- Basic tables created: `users`, `alerts`
- Connection configured with trust authentication for development

## 📊 Features Implemented

### Backend Features
- ✅ Express.js server with TypeScript
- ✅ Database connection (PostgreSQL)
- ✅ Redis caching
- ✅ JWT authentication middleware
- ✅ Request validation with Joi
- ✅ Rate limiting
- ✅ Error handling
- ✅ Logging with Pino
- ✅ Alert service with email notifications
- ✅ Price scanner service

### Frontend Features
- ✅ React with TypeScript
- ✅ Vite development server
- ✅ Tailwind CSS styling
- ✅ Modern UI components
- ✅ Responsive design
- ✅ Error boundaries

### ML Service Features
- ✅ FastAPI Python service
- ✅ Price anomaly detection
- ✅ Machine learning models
- ✅ API endpoints for predictions

## 🚧 Development Tasks

### High Priority
1. **User Authentication UI**: Create login/register forms
2. **Dashboard**: Build main user dashboard
3. **Flight Search**: Implement flight search functionality
4. **Alert Management**: Create alert CRUD operations
5. **Price History**: Display price trends and charts

### Medium Priority
1. **User Profile**: User settings and preferences
2. **Notification System**: Real-time alerts
3. **Mobile Responsiveness**: Optimize for mobile
4. **API Integration**: Connect to flight APIs
5. **Data Visualization**: Charts and graphs

### Low Priority
1. **Admin Panel**: Administrative interface
2. **Analytics**: Usage statistics
3. **Performance Optimization**: Caching strategies
4. **Internationalization**: Multi-language support
5. **Testing**: Comprehensive test suite

## 🔍 Debugging

### Common Issues
1. **Database Connection**: Check Docker containers are running
2. **Port Conflicts**: Ensure ports 3000, 5173, 8000 are available
3. **Environment Variables**: Verify .env file configuration
4. **Dependencies**: Run `npm install` if packages are missing

### Logs
- Backend logs: Console output from `npm run dev`
- Frontend logs: Browser console
- ML Service logs: Terminal output from uvicorn
- Database logs: `docker logs globegenius-postgres`

## 🧪 Testing

### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Run tests in watch mode
npm test -- --coverage     # Run tests with coverage
```

### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm test -- --coverage     # Run tests with coverage
```

### ML Service Testing
```bash
cd ml
source venv/bin/activate
pytest                      # Run all tests
pytest --cov=.             # Run tests with coverage
```

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build

# ML Service
cd ml
# Production deployment with Docker
```

### Docker Deployment
```bash
# Full stack deployment
docker-compose -f docker-compose.prod.yml up -d
```

## 📚 API Documentation

### Backend API
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI specification available

### ML Service API
- FastAPI docs: http://localhost:8000/docs
- Interactive API explorer

## 🔄 CI/CD Pipeline

### GitHub Actions
- Automated testing on push/PR
- Docker image building
- Deployment to staging/production
- Security scanning

### Status
- ✅ Pipeline configuration complete
- ✅ All tests passing
- ✅ Docker builds successful
- ✅ Security scans clean

## 🎯 Next Development Session

1. **Frontend Development**:
   - Create authentication forms
   - Build main dashboard layout
   - Implement flight search interface

2. **Backend Development**:
   - Complete user authentication endpoints
   - Implement flight search logic
   - Add alert management APIs

3. **Integration**:
   - Connect frontend to backend APIs
   - Test user flows end-to-end
   - Implement real-time notifications

4. **ML Integration**:
   - Connect price prediction to frontend
   - Implement anomaly detection alerts
   - Add historical data analysis

## 📞 Support

For development questions or issues:
1. Check this guide first
2. Review application logs
3. Check GitHub issues
4. Contact development team

---

**Last Updated**: July 16, 2025
**Status**: ✅ All services running successfully
**Next Milestone**: User authentication and dashboard
