# Task Manager — Production-Ready DevOps Project

A **professional-grade** Flask + PostgreSQL task management application with complete CI/CD, Kubernetes orchestration, and monitoring. Designed for portfolio demonstration and real-world deployment scenarios.

## 🎯 Project Overview

| Component | Technology | Port |
|-----------|-----------|------|
| **Backend API** | Flask + Gunicorn + SQLAlchemy | 8888 |
| **Frontend** | Nginx (static + reverse proxy) | 80 |
| **Database** | PostgreSQL 15 | 5432 |
| **Orchestration** | Docker Compose / Kubernetes (EKS) | - |
| **CI/CD** | Jenkins (declarative pipeline) | 8080 |
| **Monitoring** | Prometheus + Grafana | 9090/3000 |
| **Code Quality** | SonarQube | 9000 |

## ✅ Deployment Readiness Status

**Status:** ✅ **Production-Ready** (with configuration adjustments)

- ✅ Dockerized backend and frontend with multi-stage builds
- ✅ Kubernetes manifests with health checks, resource limits, and security contexts
- ✅ CI/CD pipeline with automated build, test, and deployment
- ✅ Monitoring stack with Prometheus and Grafana
- ✅ Database persistence via PVCs
- ⚠️ **Action Required:** Update secrets before production deployment (see [Security checklist](#11-security-and-best-practice-checklist))

## 🚀 Quick Start Options

Choose your deployment path:

| Option | Best For | Time to Deploy | Complexity |
|--------|----------|----------------|------------|
| **[Local (Compose)](#5-quick-start-docker-compose)** | Testing, development | ~2 minutes | ⭐ Easy |
| **[EC2 (Compose)](#6-ec2-deployment-amazon-linux-2023--docker-compose)** | Single-server production | ~15 minutes | ⭐⭐ Medium |
| **[EKS (Kubernetes)](#7-kubernetes-deployment-eks-ready)** | Scalable production | ~30 minutes | ⭐⭐⭐ Advanced |

---

## 📋 Table of Contents

- [1. Architecture](#1-architecture)
- [2. Ports and URLs](#2-ports-and-urls)
- [3. What's in this repo](#3-whats-in-this-repo)
- [4. Prerequisites](#4-prerequisites)
- [5. Quick start (Docker Compose)](#5-quick-start-docker-compose)
- [6. EC2 deployment (Amazon Linux 2023 + Docker Compose)](#6-ec2-deployment-amazon-linux-2023--docker-compose)
- [7. Kubernetes deployment (EKS-ready)](#7-kubernetes-deployment-eks-ready)
- [8. CI/CD with Jenkins](#8-cicd-with-jenkins)
- [9. Monitoring (Prometheus + Grafana on Kubernetes)](#9-monitoring-prometheus--grafana-on-kubernetes)
- [10. Troubleshooting](#10-troubleshooting)
- [11. Security and best-practice checklist](#11-security-and-best-practice-checklist)
- [12. Cleanup](#12-cleanup)

---

## 1. Architecture

### Docker Compose (single host)

```
[Browser] -> http://HOST/ (Frontend :80)
                 |
                 +--> /api/* proxied to Backend (:8888)

Backend (:8888) -> PostgreSQL (:5432)
```

### Kubernetes (EKS-ready)

- `taskmanager` namespace
- `postgres` Deployment + ClusterIP Service + PVC
- `backend` Deployment (2 replicas) + ClusterIP Service
- `frontend` Deployment (2 replicas) + LoadBalancer Service (public entry)
- Optional Ingress manifest (requires ingress-nginx installed)

---

## 2. Ports and URLs

### Docker Compose
- Frontend: `http://localhost/` (or `http://EC2_PUBLIC_IP/`)
- Backend API health (recommended): `http://localhost/api/health`
- Backend readiness: `http://localhost/api/ready`

### Kubernetes
- Frontend Service is `LoadBalancer` (AWS ELB/NLB hostname)
- Backend is internal (`ClusterIP`) and accessed via frontend `/api/*`

Important note about health endpoints:
- The Flask API blueprint is registered with `url_prefix='/api'`.
- So the health endpoints are:
  - `/api/health`
  - `/api/ready`

---

## 3. What’s in this repo

- `docker-compose.yml` — local / single-host stack (Postgres + backend + frontend)
- `backend/` — Flask backend + Dockerfile (Gunicorn)
- `frontend/` — Nginx static frontend + Dockerfile + reverse proxy for `/api/`
- `k8s/` — Kubernetes manifests for app
- `jenkins/` — Kubernetes manifests for Jenkins
- `monitoring/` — Kubernetes manifests for Prometheus + Grafana
- `Jenkinsfile` — pipeline definition

---

## 4. Prerequisites

### AWS
- AWS account + IAM user/role
- EC2 permissions (Option A)
- EKS permissions (Option B)

### Local tooling
- Git
- Docker Engine + Docker Compose v2

### For CI/CD
- DockerHub account (or adapt to ECR)
- A Kubernetes cluster + kubeconfig for Jenkins to deploy

---

## 5. Quick start (Docker Compose)

From repo root:

```bash
docker compose up -d --build
```

Verify:

```bash
curl -i http://localhost/
curl -i http://localhost/api/health
curl -i http://localhost/api/ready
```

Stop:

```bash
docker compose down
```

---

## 6. EC2 deployment (Amazon Linux 2023 + Docker Compose)

**Recommended for:** Single-server production deployments, portfolio demos, cost-effective hosting

**Estimated time:** 15-20 minutes

### 6.1 Launch EC2 Instance

**Recommended Configuration:**
- **AMI:** Amazon Linux 2023 (latest)
- **Instance type:** `t3.medium` (2 vCPU, 4GB RAM) minimum
  - For full stack + Jenkins + monitoring: `t3.large` or higher
- **Storage:** 30–50 GiB gp3 SSD
- **Key pair:** Create or use existing SSH key

**Security Group Configuration:**

| Type | Protocol | Port | Source | Purpose |
|------|----------|------|--------|---------|
| SSH | TCP | 22 | Your IP only | Secure access |
| HTTP | TCP | 80 | 0.0.0.0/0 | Frontend access |

**Security Best Practice:**
- ⚠️ Do NOT open ports 8080 (Jenkins), 9000 (SonarQube), 9090 (Prometheus), or 3000 (Grafana) to the internet
- Use SSH tunneling or `kubectl port-forward` for admin tools

### 6.2 SSH into the host

```bash
ssh -i your-key.pem ec2-user@EC2_PUBLIC_IP
```

### 6.3 System preparation and hardening

**Update system packages:**

```bash
sudo dnf -y update
sudo dnf -y install git curl wget unzip jq ca-certificates openssl

# Enable and start time synchronization (critical for distributed systems)
sudo systemctl enable --now chronyd
```

**Optional SSH hardening** (recommended for production):

```bash
# Disable password authentication (ensure key-based auth works first!)
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart sshd
```

**Verify system readiness:**

```bash
# Check timezone
timedatectl

# Check available disk space (need at least 10GB free)
df -h

# Check memory
free -h
```

### 6.4 Install Docker Engine (Amazon Linux 2023)

**Install Docker from official AL2023 repository:**

```bash
# Install Docker package
sudo dnf -y install docker

# Enable Docker service to start on boot
sudo systemctl enable --now docker

# Verify Docker is running
sudo systemctl status docker

# Add current user to docker group (avoid using sudo for docker commands)
sudo usermod -aG docker ec2-user

# Apply group changes (or logout/login)
newgrp docker

# Verify installation
docker --version
docker info
```

**Configure Docker logging** (prevents disk space exhaustion):

```bash
sudo mkdir -p /etc/docker

# Create daemon configuration with log rotation
cat | sudo tee /etc/docker/daemon.json > /dev/null << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker to apply changes
sudo systemctl restart docker
```

**Verify Docker works without sudo:**

```bash
docker run --rm hello-world
```

### 6.5 Install Docker Compose v2 (CLI Plugin)

**Recommended Time:** 2-5 minutes

Docker Compose v2 is a CLI plugin (not a standalone binary). The `docker compose` command is preferred over legacy `docker-compose`.

**Method 1: Install from AL2023 repository** (preferred)

```bash
# Install Docker Compose plugin package
sudo dnf -y install docker-compose-plugin

# Verify installation
docker compose version
# Expected output: Docker Compose version v2.x.x
```

**Method 2: Manual installation** (if package not available)

```bash
# Set desired version
COMPOSE_VERSION="v2.27.0"

# Create plugin directory
DEST="$HOME/.docker/cli-plugins"
mkdir -p "$DEST"

# Download and install plugin
curl -fsSL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-$(uname -m)" \
  -o "${DEST}/docker-compose"

# Make executable
chmod +x "${DEST}/docker-compose"

# Verify installation
docker compose version
```

**Troubleshooting:**

- If `docker compose` command not found, ensure Docker CLI plugin path is correct: `~/.docker/cli-plugins/`
- For system-wide installation, use: `/usr/local/lib/docker/cli-plugins/`

### 6.6 Clone repository and prepare workspace

**Recommended Time:** 1-2 minutes

```bash
# Navigate to home directory
cd ~

# Clone the repository (replace with your actual repository URL)
git clone https://github.com/<YOUR_USERNAME>/Python-DevOps.git

# Enter project directory
cd Python-DevOps

# Verify project structure
ls -la

# Expected output should include:
# - backend/
# - frontend/
# - k8s/
# - docker-compose.yml
# - Jenkinsfile
```

**Notes:**

- Replace `<YOUR_USERNAME>` with your actual GitHub username or organization
- For private repositories, you may need to configure SSH keys or use a personal access token
- Ensure Git is installed: `git --version`

### 6.7 Secrets handling (best practice)

The repo contains example secrets in `docker-compose.yml` and `k8s/secrets.yaml`.

Best practice:
- Don’t hardcode secrets in Git.
- Prefer AWS Secrets Manager / SSM Parameter Store.
- For a demo, keep secrets in a local `.env` with strict permissions.

Example `.env`:

```bash
umask 077
cat > .env << 'EOF'
POSTGRES_USER=taskmanager
POSTGRES_PASSWORD=CHANGE_ME_STRONG_PASSWORD
POSTGRES_DB=taskmanager_db

FLASK_ENV=production
SECRET_KEY=CHANGE_ME_LONG_RANDOM_HEX
DATABASE_URL=postgresql://taskmanager:CHANGE_ME_STRONG_PASSWORD@postgres:5432/taskmanager_db
EOF
```

Generate a strong SECRET_KEY:

```bash
python3 - << 'PY'
import secrets
print(secrets.token_hex(32))
PY
```

Note:
- `docker-compose.yml` currently uses inline env values. Refactor to `${VAR}` style if you want `.env` to actually drive Compose.

### 6.8 Deploy application with Docker Compose

**Recommended Time:** 3-5 minutes (depends on internet speed for image pulls)

**Build and start all services:**

```bash
# Build images and start containers in detached mode
docker compose up -d --build

# Expected output:
# [+] Building ...  
# [+] Running 4/4
#  ✔ Network python-devops_default      Created
#  ✔ Container python-devops-postgres-1 Started
#  ✔ Container python-devops-backend-1  Started
#  ✔ Container python-devops-frontend-1 Started
```

**Verify all containers are running:**

```bash
# Check container status
docker compose ps

# All containers should show "Up" status
# Expected output:
# NAME                          STATUS    PORTS
# python-devops-backend-1       Up        0.0.0.0:8888->8888/tcp
# python-devops-frontend-1      Up        0.0.0.0:80->80/tcp
# python-devops-postgres-1      Up        0.0.0.0:5432->5432/tcp
```

**Verify application health:**

```bash
# Test frontend (should return HTML)
curl -i http://localhost/

# Test backend health endpoint (should return {"status": "healthy"})
curl -i http://localhost/api/health

# Test backend readiness (should return {"status": "ready"})
curl -i http://localhost/api/ready

# All should return HTTP/1.1 200 OK
```

**View application logs:**

```bash
# View all service logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View specific service logs
docker compose logs backend
docker compose logs postgres
```

**Troubleshooting:**

- If backend container restarts repeatedly, check database connectivity: `docker compose logs backend`
- If health checks return 404, verify Flask app is running: `docker compose exec backend ps aux`
- If frontend shows nginx 502, check backend is responding: `curl -i http://localhost:8888/api/health`

### 6.9 Update and redeploy application

**Recommended Time:** 2-3 minutes

When code changes are pushed to the repository, update and redeploy:

**Standard update workflow:**

```bash
# Pull latest changes from repository
git pull

# Rebuild and restart containers with new code
docker compose up -d --build

# Docker Compose will:
# 1. Detect changed services
# 2. Rebuild only modified containers
# 3. Restart affected services
# 4. Keep database data intact (persistent volume)
```

**Verify deployment after update:**

```bash
# Check all containers are running
docker compose ps

# Verify health endpoints
curl -i http://localhost/api/health

# Check application logs for errors
docker compose logs --tail=50 backend
```

**Force full rebuild (if needed):**

```bash
# Rebuild all images from scratch (no cache)
docker compose build --no-cache

# Restart all services
docker compose up -d
```

**Zero-downtime updates (production):**

For production environments, consider:
- Using `docker compose up --wait --no-deps backend` to update one service at a time
- Running multiple backend replicas with a load balancer
- Implementing blue-green deployments with separate compose files

**Database migrations:**

If schema changes are included:

```bash
# Run migrations (example using Flask-Migrate)
docker compose exec backend flask db upgrade

# Or enter container shell
docker compose exec backend bash
```

---

## 7. Kubernetes deployment (EKS-ready)

### 7.1 Install AWS CLI v2

```bash
curl -fL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip -q awscliv2.zip
sudo ./aws/install
aws --version

aws configure
```

### 7.2 Install kubectl (pin version)

```bash
KUBECTL_VERSION="v1.29.0"
curl -fL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl" -o kubectl
curl -fL "https://dl.k8s.io/release/${KUBECTL_VERSION}/bin/linux/amd64/kubectl.sha256" -o kubectl.sha256

echo "$(cat kubectl.sha256)  kubectl" | sha256sum --check
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

kubectl version --client
```

### 7.3 Install eksctl

```bash
EKSCTL_VERSION="v0.188.0"
curl -fL "https://github.com/eksctl-io/eksctl/releases/download/${EKSCTL_VERSION}/eksctl_Linux_amd64.tar.gz" -o eksctl.tar.gz
tar -xzf eksctl.tar.gz
sudo mv eksctl /usr/local/bin/

eksctl version
```

### 7.4 Create an EKS cluster (example)

```bash
AWS_REGION="us-east-1"
CLUSTER_NAME="taskmanager"

eksctl create cluster \
  --name "${CLUSTER_NAME}" \
  --region "${AWS_REGION}" \
  --nodes 2 \
  --node-type t3.medium \
  --managed
```

### 7.5 Ensure images exist

The provided manifests reference DockerHub:
- `saikiranasamwar4/taskmanager-backend:v1.0`
- `saikiranasamwar4/taskmanager-frontend:v1.0`

If you use your own registry, update image names in:
- `k8s/backend-deployment.yaml`
- `k8s/frontend-deployment.yaml`

### 7.6 Apply manifests (order matters)

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/postgres-pvc.yaml
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
```

Wait for rollouts:

```bash
kubectl -n taskmanager get pods
kubectl -n taskmanager rollout status deploy/postgres --timeout=300s
kubectl -n taskmanager rollout status deploy/backend --timeout=300s
kubectl -n taskmanager rollout status deploy/frontend --timeout=300s
```

Critical note (probes):
- Backend liveness/readiness probes must hit `/api/health` and `/api/ready`.
- If you see CrashLoopBackOff due to probe failures, update `k8s/backend-deployment.yaml` probe paths.

### 7.7 Access the app

```bash
kubectl -n taskmanager get svc frontend -w
```

Open the `EXTERNAL-IP` hostname.

### 7.8 Optional: Ingress

If you want to use `k8s/ingress.yaml`, install ingress-nginx (example):

```bash
curl -fsSL https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx --create-namespace

kubectl apply -f k8s/ingress.yaml
```

---

## 8. CI/CD with Jenkins

The `Jenkinsfile` pipeline:
- Checkout
- SonarQube scan + Quality Gate
- Build backend/frontend images
- Compose smoke test
- Push to DockerHub
- Deploy to Kubernetes

### 8.1 Jenkins on Kubernetes (manifests)

```bash
kubectl apply -f jenkins/jenkins-rbac.yaml
kubectl apply -f jenkins/jenkins-deployment.yaml
```

Access (best practice: port-forward):

```bash
kubectl -n jenkins port-forward svc/jenkins 8080:8080
```

Open: `http://localhost:8080`

Security note:
- The manifest disables the setup wizard (`-Djenkins.install.runSetupWizard=false`). For best practice, remove that and configure admin/auth securely.

### 8.2 Required Jenkins credentials

Create these in Jenkins (Manage Jenkins → Credentials):
- `dockerhub-credentials` (Username/Password)
- `kubeconfig` (Secret file)
- `sonarqube-token` (Secret text)

### 8.3 SonarQube expectations

The pipeline expects SonarQube reachable at `http://localhost:9000` from the Jenkins agent.

Demo (container):

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

---

## 9. Monitoring (Prometheus + Grafana on Kubernetes)

Apply manifests:

```bash
kubectl apply -f monitoring/prometheus-rbac.yaml
kubectl apply -f monitoring/prometheus-config.yaml
kubectl apply -f monitoring/prometheus-deployment.yaml

kubectl apply -f monitoring/grafana-datasource.yaml
kubectl apply -f monitoring/grafana-dashboard-config.yaml
kubectl apply -f monitoring/grafana-deployment.yaml
```

Access Prometheus:

```bash
kubectl -n monitoring port-forward svc/prometheus 9090:9090
```

Access Grafana:

```bash
kubectl -n monitoring port-forward svc/grafana 3000:3000
```

Grafana defaults in manifest:
- user: `admin`
- password: `admin123` (change for real deployments)

Dashboard note:
- `monitoring/grafana-dashboard.json` exists but is not currently mounted/provisioned by the manifests.
- Best practice is to create a ConfigMap from the JSON and mount it into `/var/lib/grafana/dashboards`.

---

## 10. Troubleshooting

Docker:
- `docker compose ps`
- `docker compose logs -f --tail=200 backend`

Kubernetes:
- `kubectl -n taskmanager get pods`
- `kubectl -n taskmanager describe pod <pod>`
- `kubectl -n taskmanager logs deploy/backend --tail=200`

---

## 11. Security and best-practice checklist

- Restrict inbound rules (SSH from your IP only; public 80/443 only).
- Prefer port-forwarding for admin tools.
- Move secrets out of YAML/Compose into AWS managed secret stores.
- Pin tool versions and verify hashes for downloads.
- Enable HTTPS in production; set `SESSION_COOKIE_SECURE=True`.

---

## 12. Cleanup

Docker Compose:

```bash
docker compose down -v
```

Kubernetes:

```bash
kubectl delete -f monitoring/grafana-deployment.yaml
kubectl delete -f monitoring/prometheus-deployment.yaml
kubectl delete -f monitoring/prometheus-config.yaml
kubectl delete -f monitoring/prometheus-rbac.yaml

kubectl delete -f k8s/ingress.yaml || true
kubectl delete -f k8s/frontend-deployment.yaml
kubectl delete -f k8s/backend-deployment.yaml
kubectl delete -f k8s/postgres-deployment.yaml
kubectl delete -f k8s/postgres-pvc.yaml
kubectl delete -f k8s/secrets.yaml
kubectl delete -f k8s/namespace.yaml
```

EKS:

```bash
eksctl delete cluster --name taskmanager --region us-east-1
```

