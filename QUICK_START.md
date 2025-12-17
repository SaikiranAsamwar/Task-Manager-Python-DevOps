# Quick Start Guide

## ✅ All deployment files have been fixed and updated!

### What Was Fixed?
1. **Dockerfile**: Now properly copies both backend and frontend files
2. **Docker Compose**: Simplified to single-container architecture
3. **Kubernetes**: Updated manifests for unified app deployment
4. **Jenkinsfile**: Updated CI/CD pipeline for single image
5. **Added Gunicorn**: Production WSGI server for better performance

---

## 🚀 Test Locally

### Method 1: Docker Compose (Recommended)
```bash
# Build and run
docker-compose up --build

# Access application
http://localhost:5000

# Stop
docker-compose down
```

### Method 2: Docker Build Manually
```bash
# Build image (from project root)
docker build -t task-manager:test -f backend/Dockerfile .

# Run with PostgreSQL
docker run -d \
  --name test-app \
  -p 5000:5000 \
  -e DATABASE_URL=postgresql://devops_user:devops_password@host:5432/devops_db \
  task-manager:test

# Check logs
docker logs test-app -f

# Stop
docker stop test-app && docker rm test-app
```

### Method 3: Python Development Server
```bash
cd backend
python run.py
```

---

## 📦 Build for Production

### Docker Hub
```bash
# Login to Docker Hub
docker login

# Build
docker build -t yourusername/task-manager:latest -f backend/Dockerfile .

# Push
docker push yourusername/task-manager:latest
```

---

## ☸️ Deploy to Kubernetes

```bash
# Step 1: Update secrets (IMPORTANT!)
nano k8s/secrets.yaml  # Change passwords and SECRET_KEY

# Step 2: Apply manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Step 3: Verify
kubectl get pods -n task-manager
kubectl get svc -n task-manager

# Step 4: View logs
kubectl logs -n task-manager -l app=task-manager -f
```

---

## 🔍 Troubleshooting

### Image build fails?
```bash
# Make sure you're in project root
pwd  # Should show: .../Python-DevOps

# Build with verbose output
docker build --progress=plain -t task-manager:test -f backend/Dockerfile .
```

### Database connection fails?
```bash
# Check DATABASE_URL format
# Correct: postgresql://user:password@host:5432/database
# Wrong: postgres://... (use postgresql://)

# Test connection
docker exec -it devops-db psql -U devops_user -d devops_db
```

### Container crashes immediately?
```bash
# Check logs
docker logs devops-app

# Common issues:
# - DATABASE_URL not set or wrong format
# - Database not ready (add depends_on health check)
# - Port 5000 already in use
```

---

## 📝 Architecture Summary

**Before (Broken):**
```
Frontend Container (Nginx) → Can't render Jinja2 ❌
Backend Container (Flask)
Database Container (PostgreSQL)
```

**After (Fixed):**
```
App Container (Flask + Gunicorn) → Serves everything ✅
  ├── API endpoints (/api/*)
  ├── Templates (Jinja2)
  └── Static files (CSS/JS)
Database Container (PostgreSQL)
```

---

## 🎯 Key Files Changed

| File | Change |
|------|--------|
| `backend/Dockerfile` | Added Gunicorn, fixed file copying, added health check |
| `docker-compose.yml` | Removed frontend service, updated build context |
| `backend/requirements.txt` | Added gunicorn |
| `backend/run.py` | Added db.create_all(), production mode support |
| `k8s/backend-deployment.yaml` | Renamed to app, added init container |
| `k8s/secrets.yaml` | Added app-secrets with DATABASE_URL |
| `k8s/ingress.yaml` | Routes all traffic to app-service |
| `k8s/frontend-deployment.yaml` | Deprecated (no longer needed) |
| `Jenkinsfile` | Single image build, updated variables |

---

## ✨ New Features

1. **Production-Ready**: Gunicorn WSGI server (4 workers)
2. **Health Checks**: Built-in liveness/readiness probes
3. **Security**: Non-root user in container
4. **Logging**: Proper access/error logs
5. **Database**: Auto-creates tables on startup

---

## 📚 Documentation

See `DEPLOYMENT_GUIDE.md` for comprehensive deployment instructions including:
- Environment variables
- Scaling strategies
- Security checklist
- Monitoring setup
- Troubleshooting guide

---

## ⚠️ Important Notes

1. **SECRET_KEY**: Change in production! (k8s/secrets.yaml)
2. **Database Passwords**: Update default passwords
3. **Build Context**: Always build from project root
4. **Image Name**: Update `saikiranasamwar4/task-manager` to your Docker Hub username

---

## 🧪 Test Checklist

Before deploying to production:

- [ ] Build Docker image successfully
- [ ] Run with docker-compose
- [ ] Access application at http://localhost:5000
- [ ] Login works (register → login → dashboard)
- [ ] Database persists data (restart container, data remains)
- [ ] Logs show no errors
- [ ] Health check passes: `curl http://localhost:5000/`

---

## 🆘 Need Help?

1. Check logs: `docker logs <container>`
2. Verify environment variables: `docker exec <container> env`
3. Test database: `docker exec -it devops-db psql -U devops_user`
4. Review `DEPLOYMENT_GUIDE.md` for detailed troubleshooting

---

**Everything is now ready for deployment! 🎉**
