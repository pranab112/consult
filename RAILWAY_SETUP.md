# Railway Deployment Setup Guide

## Overview
This directory is configured for seamless deployment to Railway with multiple deployment strategies, environment management, and CI/CD integration.

## Required Railway Access & APIs

### 1. Railway Account Setup
- **Account**: Create a free account at [railway.app](https://railway.app)
- **Project**: Create a new project or use existing one

### 2. Required API Access

#### Railway API Token (MANDATORY)
- **Get Token**: https://railway.app/account/tokens
- **Purpose**: Authenticates CLI and API operations
- **Usage**: Add to `.env` file as `RAILWAY_TOKEN`

#### Project Configuration
- **Project ID**: Found in Railway dashboard → Settings
- **Service Name**: Your application service identifier
- **Environment**: production, staging, or custom

### 3. Available Railway Services

You can add these services to your project:
- **PostgreSQL**: Automatic `DATABASE_URL` provisioning
- **Redis**: Automatic `REDIS_URL` provisioning
- **MySQL**: Automatic connection string
- **MongoDB**: Automatic connection string

## Quick Start

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env and add your RAILWAY_TOKEN
```

### Step 3: Deploy

#### Option A: Interactive Deployment
```bash
./deploy-railway.sh
```

#### Option B: Quick Deployment
```bash
./quick-deploy.sh
```

#### Option C: Manual Deployment
```bash
railway login
railway link
railway up
```

## File Structure

```
conSULT/
├── railway.json          # Railway configuration
├── railway.toml          # Alternative config format
├── nixpacks.toml         # Build configuration
├── .env.example          # Environment template
├── deploy-railway.sh     # Interactive deployment script
├── quick-deploy.sh       # Quick deployment script
├── .github/
│   └── workflows/
│       └── railway-deploy.yml  # GitHub Actions CI/CD
└── RAILWAY_SETUP.md      # This file
```

## Configuration Files Explained

### railway.json / railway.toml
- Build and deployment configuration
- Health check settings
- Environment branching
- Replica and region settings

### nixpacks.toml
- Build system configuration
- Node.js version specification
- Build commands
- Cache configuration

### .env.example
Complete list of environment variables:
- Railway credentials
- Database connections
- External service APIs
- Application settings

## Deployment Scripts

### deploy-railway.sh
Interactive menu with options:
1. Deploy to Production
2. Deploy to Staging
3. Create Preview Deployment
4. Rollback Deployment
5. Manage Environment Variables
6. View Logs
7. Run Remote Commands

### quick-deploy.sh
One-command deployment for CI/CD or quick updates

## GitHub Actions Integration

The workflow automatically:
- Runs tests on push
- Deploys to production from `main` branch
- Deploys to staging from `develop` branch
- Creates preview deployments for PRs
- Supports rollback on failure

### GitHub Secrets Required
Add these in your GitHub repository settings:
- `RAILWAY_TOKEN`: Your Railway API token
- `RAILWAY_PROJECT_ID`: Your project ID

## Environment Variables Management

### Set Variables via CLI
```bash
railway variables set KEY=value
```

### Import from .env
```bash
./deploy-railway.sh
# Select option 5 → 4
```

### View All Variables
```bash
railway variables
```

## Monitoring & Debugging

### View Logs
```bash
# Build logs
railway logs --build

# Runtime logs
railway logs

# Stream live logs
railway logs --tail
```

### Check Status
```bash
railway status
```

### Run Commands
```bash
railway run [command]
```

## Common Deployment Patterns

### 1. Production Deployment
```bash
git push origin main
# GitHub Actions will auto-deploy
# OR manually:
./deploy-railway.sh # Select option 1
```

### 2. Staging Deployment
```bash
git push origin develop
# OR manually:
railway up --environment staging
```

### 3. Preview Deployment
```bash
# Create PR on GitHub
# Automatically creates preview
# OR manually:
railway up --environment preview-feature-x
```

### 4. Rollback
```bash
./deploy-railway.sh # Select option 4
# OR:
railway rollback
```

## Database Management

### PostgreSQL Setup
Railway automatically provides:
- `DATABASE_URL`
- Connection pooling
- Automatic backups

### Running Migrations
```bash
railway run npm run migrate
```

### Database Access
```bash
railway run npx prisma studio
# OR
railway connect postgres
```

## Custom Domains

### Add Domain
```bash
railway domain
```

### Configure DNS
Add CNAME record pointing to Railway's provided domain

## Troubleshooting

### Build Failures
1. Check `nixpacks.toml` configuration
2. Verify Node.js version
3. Check build logs: `railway logs --build`

### Deployment Issues
1. Verify environment variables
2. Check health endpoint
3. Review deployment logs

### Connection Problems
1. Verify `RAILWAY_TOKEN` is set
2. Check project linking: `railway status`
3. Re-link if needed: `railway link`

## Security Best Practices

1. **Never commit** `.env` file
2. **Use secrets** for sensitive data
3. **Rotate tokens** regularly
4. **Enable 2FA** on Railway account
5. **Review access** permissions regularly

## Support & Resources

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Status Page: https://status.railway.app
- CLI Reference: https://docs.railway.app/cli/api-reference

## Cost Optimization

- Use `numReplicas: 1` for development
- Enable auto-sleep for staging
- Monitor usage in Railway dashboard
- Set spend alerts

## Next Steps

1. Add your `RAILWAY_TOKEN` to `.env`
2. Create a Railway project
3. Link your repository
4. Run your first deployment
5. Configure custom domain (optional)

---

For questions or issues, check Railway's documentation or community Discord.