# Full-Stack StudyAbroad Deployment Guide

## Architecture Overview

This is a full-stack application with:
- **Frontend**: React + Vite + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL
- **Deployment**: Railway

## Project Structure

```
conSULT/
├── src/                    # Frontend React application
├── backend/
│   ├── src/
│   │   ├── server.ts      # Express server entry
│   │   ├── db/            # Database schema & initialization
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Auth, error handling, rate limiting
│   │   └── utils/         # Logging & utilities
│   └── package.json       # Backend dependencies
├── package.json           # Frontend + orchestration scripts
└── railway.json           # Railway deployment config
```

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL (optional for local testing)

### Setup

1. **Install dependencies**:
```bash
npm install
cd backend && npm install && cd ..
# OR
npm run install:all
```

2. **Configure environment**:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your local PostgreSQL credentials
```

3. **Run development servers**:
```bash
npm run dev
# This starts both frontend (port 5173) and backend (port 5000)
```

## Railway Deployment

### One-Time Setup

1. **Install Railway CLI**:
```bash
npm install -g @railway/cli
```

2. **Login to Railway**:
```bash
railway login
```

3. **Create/Link Project**:
```bash
railway link
# Select "studyabroad-consultancy-app" or create new
```

4. **Add PostgreSQL**:
```bash
railway add
# Select PostgreSQL
```

### Deploy to Railway

#### Method 1: Full-Stack Script (Recommended)
```bash
./deploy-fullstack.sh
```
This script:
- Links to Railway project
- Adds PostgreSQL if not exists
- Sets environment variables
- Builds and deploys application

#### Method 2: Manual Deployment
```bash
# Set environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Deploy
railway up
```

#### Method 3: Quick Deploy
```bash
./quick-deploy.sh
```

### Railway Environment Variables

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port

You need to set:
- `JWT_SECRET` - For authentication tokens
- `NODE_ENV=production`

## Database Management

### Initialize Schema

The backend automatically creates tables on first run using `src/db/schema.sql`.

### Access Database
```bash
railway connect postgres
```

### Run Migrations
```bash
railway run npm run db:migrate
```

## API Endpoints

Base URL: `https://your-app.railway.app/api`

### Authentication
- `POST /auth/register` - Register new agency
- `POST /auth/login` - User login

### Students
- `GET /students` - List all students
- `POST /students` - Create student
- `PUT /students/:id` - Update student
- `DELETE /students/:id` - Delete student

### Documents
- `GET /documents/student/:id` - Get student documents

### Agencies
- `GET /agencies/settings` - Get agency settings
- `PUT /agencies/settings` - Update settings

## Frontend-Backend Integration

The frontend uses environment variables for API URL:
- Development: `http://localhost:5000/api`
- Production: `/api` (relative path)

Authentication flow:
1. User logs in via `/api/auth/login`
2. Backend returns JWT token
3. Frontend stores token in localStorage
4. Token sent in Authorization header for protected routes

## Monitoring & Debugging

### View Logs
```bash
railway logs --tail
```

### Check Status
```bash
railway status
```

### View Deployment URL
```bash
railway domain
```

## Troubleshooting

### Build Failures
1. Check Node.js version in `nixpacks.toml`
2. Verify all dependencies installed
3. Check build logs: `railway logs --build`

### Database Connection Issues
1. Verify `DATABASE_URL` is set: `railway variables`
2. Check PostgreSQL service status in Railway dashboard
3. Ensure schema initialized correctly

### CORS Errors
1. Update `FRONTEND_URL` in environment variables
2. Check CORS configuration in `backend/src/server.ts`

## Production Checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Configure proper CORS origins
- [ ] Enable HTTPS (Railway provides automatically)
- [ ] Set up monitoring/logging service
- [ ] Configure rate limiting
- [ ] Review security headers
- [ ] Set up database backups
- [ ] Configure custom domain (optional)

## Cost Optimization

- Railway provides $5 free credits monthly
- PostgreSQL addon: ~$7/month
- Web service: ~$5/month for hobby usage
- Total: ~$12/month for production deployment

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Report bugs in your repository