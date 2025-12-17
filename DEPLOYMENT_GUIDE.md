# Deployment Guide - Task Manager Application

## Architecture Overview

The application now uses a **single-container architecture** where the Flask backend serves both:
- REST API endpoints (`/api/*`)
- Frontend templates (Jinja2 server-side rendering)
- Static assets (CSS, JavaScript)

### Technology Stack
- **Backend**: Flask 3.0.0 + Gunicorn (production WSGI server)
- **Database**: PostgreSQL 15
- **Frontend**: Jinja2 templates + Vanilla JavaScript
- **Container**: Python 3.11-slim with non-root user

---

## Local Development

### Prerequisites
- Python 3.11+
- PostgreSQL (optional - uses SQLite by default)

### Setup
```bash
# Navigate to project directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py
```

Access at: http://localhost:5000

---

## Docker Deployment

### Using Docker Compose (Recommended for local testing)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services:**
- Application: http://localhost:5000
- PostgreSQL: localhost:5432

### Building Individual Container

```bash
# Build the application image
docker build -t task-manager:latest -f backend/Dockerfile ./backend

# Run with PostgreSQL
docker run -d \
  --name task-manager-app \
  -p 5000:5000 \
  -e FLASK_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/dbname \
  task-manager:latest
```

---

## Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (EKS, GKE, or local minikube)
- kubectl configured
- Docker images pushed to registry

### Step 1: Create Namespace
```bash
kubectl apply -f k8s/namespace.yaml
```

### Step 2: Create Secrets
```bash
# IMPORTANT: Update secrets.yaml with production values!
kubectl apply -f k8s/secrets.yaml
```

⚠️ **Security Warning**: Replace default passwords and SECRET_KEY in production!

### Step 3: Deploy Database
```bash
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
```

### Step 4: Deploy Application
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

### Step 5: Setup Ingress (Optional)
```bash
kubectl apply -f k8s/ingress.yaml
```

### Verify Deployment
```bash
# Check pods
kubectl get pods -n task-manager

# Check services
kubectl get svc -n task-manager

# View application logs
kubectl logs -n task-manager -l app=task-manager -f

# Check database logs
kubectl logs -n task-manager -l app=postgres -f
```

---

## CI/CD with Jenkins

### Prerequisites
1. Jenkins server with Docker installed
2. Docker Hub credentials added to Jenkins:
   - Credential ID: `dockerhub-credentials`
3. Kubernetes config added to Jenkins:
   - Credential ID: `kubeconfig-eks`

### Pipeline Flow
1. **Checkout**: Pull code from Git
2. **Build**: Create Docker image
3. **Push**: Upload to Docker Hub
4. **Deploy**: Update Kubernetes cluster

### Environment Variables
Configure in Jenkins:
- `DOCKER_HUB_REPO`: Your Docker Hub username/org
- `K8S_NAMESPACE`: task-manager

### Trigger Build
```bash
# Push to main branch
git push origin main
```

Jenkins will automatically:
- Build image tagged as `latest` and `<BUILD_NUMBER>`
- Push to Docker Hub
- Deploy to Kubernetes

---

## Environment Variables

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `FLASK_ENV` | Environment mode | `production` or `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |

### Optional
| Variable | Description | Default |
|----------|-------------|---------|
| `SECRET_KEY` | Flask secret key | Auto-generated |

---

## Production Checklist

### Security
- [ ] Update `SECRET_KEY` in k8s/secrets.yaml
- [ ] Change database passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Use secrets management (Vault, AWS Secrets Manager)

### Performance
- [ ] Adjust Gunicorn workers (currently 4)
- [ ] Configure resource limits in k8s
- [ ] Set up database connection pooling
- [ ] Enable caching (Redis)

### Monitoring
- [ ] Configure health checks
- [ ] Set up logging aggregation
- [ ] Add application metrics (Prometheus)
- [ ] Configure alerts

### Backup
- [ ] PostgreSQL automated backups
- [ ] PersistentVolume snapshots
- [ ] Database migration strategy

---

## Troubleshooting

### Container Won't Start
```bash
# Check logs
docker logs <container-id>

# Common issues:
# 1. Database connection failed - verify DATABASE_URL
# 2. Port already in use - change port mapping
# 3. Permission denied - check file permissions
```

### Kubernetes Pod Crashes
```bash
# Get pod details
kubectl describe pod -n task-manager <pod-name>

# View logs
kubectl logs -n task-manager <pod-name>

# Common issues:
# 1. Image pull failed - verify image exists in registry
# 2. CrashLoopBackOff - check DATABASE_URL and secrets
# 3. Init container failed - database not ready
```

### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it -n task-manager <app-pod> -- \
  psql postgresql://user:pass@postgres-service:5432/dbname

# Check database service
kubectl get svc -n task-manager postgres-service
```

### Application Errors
```bash
# Enable debug mode (development only!)
export FLASK_ENV=development

# View detailed logs
kubectl logs -n task-manager -l app=task-manager --tail=100
```

---

## Scaling

### Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: app-hpa
  namespace: task-manager
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Manual Scaling
```bash
# Scale to 5 replicas
kubectl scale deployment app -n task-manager --replicas=5
```

---

## Architecture Changes from Original

### What Changed?
1. **Removed**: Separate frontend Nginx container
2. **Simplified**: Single Flask container serves everything
3. **Added**: Gunicorn production WSGI server
4. **Updated**: Docker images and Kubernetes manifests

### Why?
Your application uses **server-side rendering** (Jinja2 templates), not a separate frontend SPA. The previous architecture tried to serve Jinja2 templates through Nginx, which doesn't work.

### Migration Path
If you want to convert to microservices later:
1. Build a React/Vue/Angular frontend
2. Convert backend to pure REST API
3. Deploy frontend as separate static site

---

## Support

For issues or questions:
1. Check logs: `kubectl logs` or `docker logs`
2. Review application errors in browser console
3. Verify environment variables are set correctly
4. Test database connectivity

**Important Files:**
- Application: `backend/run.py`
- Configuration: `backend/app/__init__.py`
- Docker: `backend/Dockerfile`
- K8s Manifests: `k8s/*.yaml`
- CI/CD: `Jenkinsfile`
