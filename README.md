# Task Manager - DevOps Deployment Platform

A full-stack Flask application for task and project management with role-based access control. Built with Flask, PostgreSQL, and containerized for production deployment on AWS EKS with complete CI/CD pipeline.

## 📋 Table of Contents

### SECTION A: INSTALLATION & CONFIGURATION
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Step 1: EC2 Instance Setup](#step-1-ec2-instance-setup)
- [Step 2: Install Docker](#step-2-install-docker)
- [Step 3: Install Docker Compose](#step-3-install-docker-compose)
- [Step 4: Install Python](#step-4-install-python)
- [Step 5: Install AWS CLI](#step-5-install-aws-cli)
- [Step 6: Install kubectl](#step-6-install-kubectl)
- [Step 7: Install eksctl](#step-7-install-eksctl)
- [Step 8: Install Java](#step-8-install-java)
- [Step 9: Install PostgreSQL](#step-9-install-postgresql-for-sonarqube)
- [Step 10: Install & Configure Jenkins](#step-10-install--configure-jenkins)
- [Step 11: Install & Configure SonarQube](#step-11-install--configure-sonarqube)
- [Step 12: Install & Configure Prometheus](#step-12-install--configure-prometheus)
- [Step 13: Install & Configure Grafana](#step-13-install--configure-grafana)

### SECTION B: DEPLOYMENT
- [Step 14: Clone & Configure Application](#step-14-clone--configure-application)
- [Step 15: Docker Deployment](#step-15-docker-deployment)
- [Step 16: Kubernetes (EKS) Deployment](#step-16-kubernetes-eks-deployment)
- [Step 17: Setup CI/CD Pipeline](#step-17-setup-cicd-pipeline)
- [Step 18: Verify Monitoring](#step-18-verify-monitoring)

### SECTION C: REFERENCE
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Quick Reference Commands](#quick-reference-commands)
- [Project Structure](#project-structure)

---

## Architecture Overview

```
├── Backend (Flask + Gunicorn) - Port 8888
├── Frontend (HTML/CSS/JS + Nginx) - Port 80
├── Database (PostgreSQL) - Port 5432
├── Container Registry (DockerHub)
├── Orchestration (Amazon EKS)
├── CI/CD (Jenkins)
├── Code Quality (SonarQube)
└── Monitoring (Prometheus + Grafana)
```

---

## Prerequisites

### AWS Requirements
- AWS Account with IAM user
- Access to EC2, EKS, IAM, VPC services
- SSH key pair for EC2 access

### Local Requirements
- Git installed
- SSH client
- DockerHub account

---

# SECTION A: INSTALLATION & CONFIGURATION

## Step 1: EC2 Instance Setup

### 1.1 Launch EC2 Instance

**Instance Configuration:**
- **AMI:** Amazon Linux 2023
- **Instance Type:** t3.large (minimum for running Jenkins + SonarQube)
- **Storage:** 50 GB gp3
- **Security Group Ports:**
  - 22 (SSH)
  - 80 (Frontend)
  - 8888 (Backend)
  - 8080 (Jenkins)
  - 9000 (SonarQube)
  - 9090 (Prometheus)
  - 3000 (Grafana)
  - 5432 (PostgreSQL)

### 1.2 Connect to EC2

```bash
# Set permissions for your key
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ec2-user@your-ec2-public-ip
```

### 1.3 Initial System Update

```bash
# Update all packages
sudo dnf update -y

# Install basic utilities
sudo dnf install -y git wget curl tar unzip vim nano
```

---

## Step 2: Install Docker

```bash
# Install Docker
sudo dnf install -y docker

# Start and enable Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group (avoid sudo)
sudo usermod -aG docker ec2-user

# Apply group changes
newgrp docker

# Verify installation
docker --version
docker ps
```

---

## Step 3: Install Docker Compose

```bash
# Download Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

---

## Step 4: Install Python

```bash
# Install Python 3.11
sudo dnf install -y python3.11 python3.11-pip

# Verify installation
python3.11 --version
pip3.11 --version

# Create symbolic links
sudo ln -sf /usr/bin/python3.11 /usr/bin/python3
sudo ln -sf /usr/bin/pip3.11 /usr/bin/pip3

# Install virtual environment
pip3 install virtualenv
```

---

## Step 5: Install AWS CLI

```bash
# Download AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip

# Unzip
unzip awscliv2.zip

# Install
sudo ./aws/install

# Verify
aws --version

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, Region (us-east-1), Output format (json)
```

---

## Step 6: Install kubectl

```bash
# Download kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Make executable
chmod +x kubectl

# Move to PATH
sudo mv kubectl /usr/local/bin/

# Verify
kubectl version --client
```

---

## Step 7: Install eksctl

```bash
# Download eksctl
curl -sLO "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_Linux_amd64.tar.gz"

# Extract
tar -xzf eksctl_Linux_amd64.tar.gz

# Move to PATH
sudo mv eksctl /usr/local/bin/

# Verify
eksctl version
```

---

## Step 8: Install Java

```bash
# Install Amazon Corretto 17 (OpenJDK)
sudo dnf install -y java-17-amazon-corretto

# Verify
java -version
```

---

## Step 9: Install PostgreSQL (for SonarQube)

```bash
# Install PostgreSQL 15
sudo dnf install -y postgresql15-server

# Initialize database
sudo postgresql-setup --initdb

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Configure PostgreSQL for SonarQube

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run these commands:
CREATE USER sonarqube WITH ENCRYPTED PASSWORD 'sonar123';
CREATE DATABASE sonarqube OWNER sonarqube;
GRANT ALL PRIVILEGES ON DATABASE sonarqube TO sonarqube;
\q

# Edit PostgreSQL authentication config
sudo nano /var/lib/pgsql/data/pg_hba.conf
```

**Add this line before the other entries:**
```
host    sonarqube       sonarqube       127.0.0.1/32            md5
```

**Restart PostgreSQL:**
```bash
sudo systemctl restart postgresql

# Test connection
psql -h localhost -U sonarqube -d sonarqube
# Enter password: sonar123
# Type \q to exit
```

---

## Step 10: Install & Configure Jenkins

### 10.1 Install Jenkins

```bash
# Add Jenkins repository
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo

# Import Jenkins key
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key

# Install Jenkins
sudo dnf install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Check status
sudo systemctl status jenkins
```

### 10.2 Configure Jenkins Initial Setup

```bash
# Get initial admin password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword

# Access Jenkins UI
# Open browser: http://your-ec2-public-ip:8080
```

**Jenkins Initial Setup:**
1. Paste the initial admin password
2. Install suggested plugins
3. Create admin user
4. Configure Jenkins URL

### 10.3 Install Required Jenkins Plugins

**Required Plugins:**
- Docker Pipeline
- Kubernetes
- Git
- Pipeline
- AWS Steps
- SonarQube Scanner
- Python Plugin

**Install via UI:**
1. Dashboard → Manage Jenkins → Plugins
2. Search and install each plugin
3. Restart Jenkins

### 10.4 Configure Jenkins Credentials

**Add DockerHub Credentials:**
1. Manage Jenkins → Credentials → System → Global credentials
2. Add Credentials → Username with password
3. ID: `dockerhub-credentials`
4. Username: Your DockerHub username (e.g., saikiranasamwar4)
5. Password: Your DockerHub password

**Add AWS Credentials:**
1. Add Credentials → AWS Credentials
2. ID: `aws-credentials`
3. Access Key ID: Your AWS access key
4. Secret Access Key: Your AWS secret key

**Add GitHub Credentials (for Private Repositories):**
1. Add Credentials → Username with password (or Personal Access Token)
2. ID: `github-credentials`
3. Username: Your GitHub username
4. Password: GitHub Personal Access Token
   - Generate token at: https://github.com/settings/tokens
   - Required scopes: `repo`, `admin:repo_hook`

**Add SonarQube Token:**
1. First, generate token in SonarQube UI:
   - Login to SonarQube: `http://your-ec2-public-ip:9000`
   - My Account → Security → Generate Token
   - Name: `jenkins`
   - Copy the generated token
2. Back in Jenkins → Add Credentials → Secret text
3. ID: `sonarqube-token`
4. Secret: Paste the SonarQube token

### 10.5 Configure GitHub Webhook (for Auto-Trigger)

**In GitHub Repository:**
1. Go to your repository → Settings → Webhooks
2. Click **Add webhook**
3. Payload URL: `http://your-ec2-public-ip:8080/github-webhook/`
4. Content type: `application/json`
5. Select events: **Just the push event**
6. Active: ✓ Check
7. Click **Add webhook**

**In Jenkins Job Configuration:**
1. Open your pipeline job
2. Build Triggers → Check **GitHub hook trigger for GITScm polling**
3. Save

### 10.6 Configure SonarQube Integration

**In Jenkins:**
1. Manage Jenkins → Configure System
2. Scroll to **SonarQube servers**
3. Click **Add SonarQube**
4. Name: `SonarQube`
5. Server URL: `http://localhost:9000`
6. Server authentication token: Select `sonarqube-token` from dropdown
7. Click **Save**

---

## Step 11: Install & Configure SonarQube

### 11.1 Install SonarQube

```bash
# Create sonarqube user
sudo useradd -r -s /bin/false sonarqube

# Download SonarQube
cd /opt
sudo wget https://binaries.sonarsource.com/Distribution/sonarqube/sonarqube-9.9.0.65466.zip

# Unzip
sudo unzip sonarqube-9.9.0.65466.zip
sudo mv sonarqube-9.9.0.65466 sonarqube

# Set ownership
sudo chown -R sonarqube:sonarqube /opt/sonarqube

# Set system limits
sudo tee /etc/security/limits.d/99-sonarqube.conf << EOF
sonarqube   -   nofile   65536
sonarqube   -   nproc    4096
EOF

# Set kernel parameters
sudo tee -a /etc/sysctl.conf << EOF
vm.max_map_count=262144
fs.file-max=65536
EOF

# Apply settings
sudo sysctl -p
```

### 11.2 Configure SonarQube Database Connection

```bash
# Edit SonarQube configuration
sudo nano /opt/sonarqube/conf/sonar.properties
```

**Uncomment and update these lines:**
```properties
sonar.jdbc.username=sonarqube
sonar.jdbc.password=sonar123
sonar.jdbc.url=jdbc:postgresql://localhost/sonarqube
```

**Save and exit (Ctrl+X, Y, Enter)**

### 11.3 Configure SonarQube Service

```bash
# Create systemd service
sudo tee /etc/systemd/system/sonarqube.service << 'EOF'
[Unit]
Description=SonarQube service
After=network.target

[Service]
Type=forking
ExecStart=/opt/sonarqube/bin/linux-x86-64/sonar.sh start
ExecStop=/opt/sonarqube/bin/linux-x86-64/sonar.sh stop
User=sonarqube
Group=sonarqube
Restart=always
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
EOF

# Start SonarQube
sudo systemctl start sonarqube
sudo systemctl enable sonarqube

# Check status
sudo systemctl status sonarqube
```

### 11.4 Access SonarQube UI

```bash
# Wait for startup (1-2 minutes)
# Access: http://your-ec2-public-ip:9000

# Default credentials:
# Username: admin
# Password: admin
```

### 11.5 Configure SonarQube Project

**In SonarQube UI:**
1. Create new project
2. Project key: `taskmanager`
3. Generate token
4. Copy token

**Configure in Jenkins:**
1. Manage Jenkins → Configure System
2. SonarQube servers → Add SonarQube
3. Name: `SonarQube`
4. Server URL: `http://localhost:9000`
5. Add token in credentials

---

## Step 12: Install & Configure Prometheus

### 12.1 Download and Install Prometheus

```bash
# Create prometheus user
sudo useradd --no-create-home --shell /bin/false prometheus

# Create directories
sudo mkdir /etc/prometheus
sudo mkdir /var/lib/prometheus

# Set ownership
sudo chown prometheus:prometheus /etc/prometheus
sudo chown prometheus:prometheus /var/lib/prometheus

# Download Prometheus
cd /tmp
wget https://github.com/prometheus/prometheus/releases/download/v2.48.0/prometheus-2.48.0.linux-amd64.tar.gz

# Extract
tar -xvf prometheus-2.48.0.linux-amd64.tar.gz
cd prometheus-2.48.0.linux-amd64

# Copy binaries
sudo cp prometheus /usr/local/bin/
sudo cp promtool /usr/local/bin/

# Set ownership
sudo chown prometheus:prometheus /usr/local/bin/prometheus
sudo chown prometheus:prometheus /usr/local/bin/promtool

# Copy configuration files
sudo cp -r consoles /etc/prometheus
sudo cp -r console_libraries /etc/prometheus
sudo cp prometheus.yml /etc/prometheus/prometheus.yml

# Set ownership
sudo chown -R prometheus:prometheus /etc/prometheus

# Verify installation
prometheus --version
```

### 12.2 Configure Prometheus

```bash
# Edit Prometheus configuration
sudo nano /etc/prometheus/prometheus.yml
```

**Replace with the following configuration:**
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Backend application metrics
  - job_name: 'taskmanager-backend'
    static_configs:
      - targets: ['localhost:8888']
    metrics_path: '/metrics'

  # Node Exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
```

**Save and exit (Ctrl+X, Y, Enter)**

### 12.3 Validate Configuration

```bash
# Validate configuration file
sudo -u prometheus /usr/local/bin/promtool check config /etc/prometheus/prometheus.yml

# Fix permissions if needed
sudo chown -R prometheus:prometheus /etc/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus
sudo chmod 755 /etc/prometheus
sudo chmod 755 /var/lib/prometheus
```

### 12.4 Create Prometheus Service

```bash
# Create systemd service file
sudo tee /etc/systemd/system/prometheus.service << 'EOF'
[Unit]
Description=Prometheus
Wants=network-online.target
After=network-online.target

[Service]
User=prometheus
Group=prometheus
Type=simple
Restart=on-failure
RestartSec=5s
ExecStart=/usr/local/bin/prometheus \
  --config.file=/etc/prometheus/prometheus.yml \
  --storage.tsdb.path=/var/lib/prometheus/ \
  --web.console.templates=/etc/prometheus/consoles \
  --web.console.libraries=/etc/prometheus/console_libraries \
  --web.enable-lifecycle
ExecReload=/bin/kill -HUP $MAINPID
TimeoutStopSec=20s
SendSIGKILL=no

[Install]
WantedBy=multi-user.target
EOF

# Reload systemd
sudo systemctl daemon-reload

# Start Prometheus
sudo systemctl start prometheus
sudo systemctl enable prometheus

# Wait for service to start
sleep 5

# Check status
sudo systemctl status prometheus

# Check logs if failed
sudo journalctl -u prometheus -n 50 --no-pager
```

### 12.5 Install Node Exporter (System Metrics)

```bash
# Download Node Exporter
cd /tmp
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz

# Extract
tar -xvf node_exporter-1.7.0.linux-amd64.tar.gz

# Copy binary
sudo cp node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/

# Create user
sudo useradd --no-create-home --shell /bin/false node_exporter

# Set ownership
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter

# Create systemd service
sudo tee /etc/systemd/system/node_exporter.service << 'EOF'
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target
EOF

# Start Node Exporter
sudo systemctl daemon-reload
sudo systemctl start node_exporter
sudo systemctl enable node_exporter

# Check status
sudo systemctl status node_exporter
```

### 12.6 Verify Prometheus

```bash
# Check if Prometheus is listening
sudo ss -tlnp | grep ':9090'

# Test Prometheus API
curl http://localhost:9090/-/healthy

# Access Prometheus UI
# Open browser: http://your-ec2-public-ip:9090

# Check targets
# Go to Status → Targets to verify all targets are UP
```

### 12.7 Troubleshoot Prometheus Issues

If Prometheus fails to start, use these commands:

```bash
# Check service status
sudo systemctl status prometheus

# View detailed logs
sudo journalctl -u prometheus -n 100 --no-pager

# Validate configuration
sudo -u prometheus /usr/local/bin/promtool check config /etc/prometheus/prometheus.yml

# Check permissions
ls -la /etc/prometheus
ls -la /var/lib/prometheus

# Fix permissions
sudo chown -R prometheus:prometheus /etc/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus

# Check port availability
sudo ss -tlnp | grep ':9090'

# If data is corrupted, clean and restart
sudo systemctl stop prometheus
sudo rm -rf /var/lib/prometheus/wal
sudo mkdir -p /var/lib/prometheus
sudo chown -R prometheus:prometheus /var/lib/prometheus
sudo systemctl start prometheus
```

**Common Prometheus Errors and Solutions:**

1. **"Permission denied" errors:**
   ```bash
   sudo chown -R prometheus:prometheus /etc/prometheus /var/lib/prometheus
   ```

2. **"Config file invalid" errors:**
   ```bash
   sudo -u prometheus /usr/local/bin/promtool check config /etc/prometheus/prometheus.yml
   ```

3. **Service fails to start:**
   ```bash
   sudo journalctl -u prometheus -n 50
   # Check for specific error and fix accordingly
   ```

4. **Port already in use:**
   ```bash
   sudo ss -tulpn | grep ':9090'  # Find what's using the port
   sudo kill -9 <PID>             # Kill the process
   ```

5. **Corrupted WAL (Write-Ahead Log):**
   ```bash
   sudo systemctl stop prometheus
   sudo rm -rf /var/lib/prometheus/wal
   sudo systemctl start prometheus
   ```

---

## Step 13: Install & Configure Grafana

### 13.1 Install Grafana

```bash
# Add Grafana repository
sudo tee /etc/yum.repos.d/grafana.repo << 'EOF'
[grafana]
name=grafana
baseurl=https://rpm.grafana.com
repo_gpgcheck=1
enabled=1
gpgcheck=1
gpgkey=https://rpm.grafana.com/gpg.key
sslverify=1
sslcacert=/etc/pki/tls/certs/ca-bundle.crt
EOF

# Install Grafana
sudo dnf install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Check status
sudo systemctl status grafana-server
```

### 13.2 Access Grafana UI

```bash
# Access Grafana
# Open browser: http://your-ec2-public-ip:3000

# Default credentials:
# Username: admin
# Password: admin
# (You'll be prompted to change password on first login)
```

### 13.3 Configure Prometheus Data Source in Grafana

**In Grafana UI:**
1. Login with admin/admin
2. Change password when prompted
3. Click **Add your first data source**
4. Select **Prometheus**
5. Configure:
   - Name: `Prometheus`
   - URL: `http://localhost:9090`
   - Access: `Server (default)`
6. Click **Save & Test**
7. Should show "Data source is working"

### 13.4 Import Pre-built Dashboards

**Import Node Exporter Dashboard:**
1. Click **+** → **Import**
2. Enter dashboard ID: `1860`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

**Import Custom Task Manager Dashboard (if available):**
1. Click **+** → **Import**
2. Upload `monitoring/grafana-dashboard.json` from your project
3. Select Prometheus data source
4. Click **Import**

### 13.5 Create Simple Dashboard for Task Manager

If custom dashboard doesn't exist, create one:

1. Click **+** → **Dashboard** → **Add new panel**
2. Query examples:
   - HTTP Request Rate: `rate(http_requests_total[5m])`
   - Memory Usage: `process_resident_memory_bytes`
   - Active Connections: `http_requests_active`
3. Customize visualization
4. Click **Save** → Name: `Task Manager Monitoring`

---

# SECTION B: DEPLOYMENT

## Step 14: Clone & Configure Application

### 14.1 Clone Repository

```bash
# Clone your repository
cd ~
git clone https://github.com/your-username/Python-DevOps.git
cd Python-DevOps
```

### 14.2 Configure Environment Variables

```bash
# Create .env file in backend directory
cd backend
nano .env
```

**Add the following variables:**
```bash
SECRET_KEY=your-super-secret-key-change-in-production
FLASK_ENV=production
DATABASE_URL=postgresql://taskmanager:taskmanager123@postgres:5432/taskmanager_db
```

**Generate a secure secret key:**
```bash
python3 -c 'import secrets; print(secrets.token_hex(32))'
```

### 14.3 Create Required Directories

```bash
# Create instance directory for SQLite (if needed)
cd ~/Python-DevOps/backend
mkdir -p instance

# Set permissions
chmod -R 755 instance
```

---

## Step 15: Docker Deployment

### 15.1 Login to DockerHub

```bash
# Login to DockerHub
docker login
# Enter username: saikiranasamwar4
# Enter password when prompted
```

### 15.2 Build Docker Images

```bash
# Navigate to project directory
cd ~/Python-DevOps

# Build backend image
docker build -t saikiranasamwar4/taskmanager-backend:v1.0 -f backend/Dockerfile backend/

# Build frontend image
docker build -t saikiranasamwar4/taskmanager-frontend:v1.0 -f frontend/Dockerfile frontend/
```

### 15.3 Push Images to DockerHub

```bash
# Push backend
docker push saikiranasamwar4/taskmanager-backend:v1.0

# Push frontend
docker push saikiranasamwar4/taskmanager-frontend:v1.0

# Also tag and push as latest for docker-compose compatibility
docker tag saikiranasamwar4/taskmanager-backend:v1.0 saikiranasamwar4/taskmanager-backend:latest
docker tag saikiranasamwar4/taskmanager-frontend:v1.0 saikiranasamwar4/taskmanager-frontend:latest
docker push saikiranasamwar4/taskmanager-backend:latest
docker push saikiranasamwar4/taskmanager-frontend:latest
```

### 15.4 Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check running containers
docker ps

# Stop services
docker-compose down
```

### 15.5 Verify Application

```bash
# Check backend health
curl http://localhost:8888/

# Check PostgreSQL connection
docker exec -it python-devops-postgres-1 psql -U taskmanager -d taskmanager_db -c "\dt"

# Access frontend
curl http://localhost:80
```

**Access in browser:**
- Frontend: `http://your-ec2-public-ip`
- Backend API: `http://your-ec2-public-ip:8888`

---

## Step 16: Kubernetes (EKS) Deployment

### 16.1 Create EKS Cluster

```bash
# Create EKS cluster (takes 15-20 minutes)
eksctl create cluster \
  --name taskmanager-cluster \
  --region us-east-1 \
  --nodegroup-name taskmanager-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed

# Verify cluster
kubectl get nodes
```

### 16.2 Create Namespace

```bash
# Navigate to k8s directory
cd ~/Python-DevOps/k8s

# Create namespace
kubectl apply -f namespace.yaml

# Set as default
kubectl config set-context --current --namespace=taskmanager
```

### 16.3 Create PostgreSQL Secret

```bash
# Create secret for PostgreSQL
kubectl apply -f secrets.yaml

# Verify
kubectl get secrets -n taskmanager
```

### 16.4 Deploy PostgreSQL

```bash
# Deploy PostgreSQL PVC
kubectl apply -f postgres-pvc.yaml -n taskmanager

# Deploy PostgreSQL
kubectl apply -f postgres-deployment.yaml -n taskmanager

# Check status
kubectl get deployments -n taskmanager
kubectl get pods -n taskmanager
kubectl get pvc -n taskmanager
```

### 16.5 Deploy Backend

```bash
# Deploy backend
kubectl apply -f backend-deployment.yaml -n taskmanager

# Check status
kubectl get deployments -n taskmanager
kubectl get pods -n taskmanager
kubectl get services -n taskmanager
```

### 16.6 Deploy Frontend

```bash
# Deploy frontend
kubectl apply -f frontend-deployment.yaml -n taskmanager

# Check all resources
kubectl get all -n taskmanager
```

### 16.7 Access Application

```bash
# Get LoadBalancer URL for frontend
kubectl get service frontend -n taskmanager

# Note the EXTERNAL-IP (LoadBalancer DNS)
# Access: http://<EXTERNAL-IP>
```

### 16.8 Manual Kubernetes Deployment (Alternative to CI/CD)

If you want to deploy manually without Jenkins, follow these steps:

```bash
# 1. Update kubeconfig
aws eks update-kubeconfig --name taskmanager-cluster --region us-east-1

# 2. Create namespace
kubectl apply -f k8s/namespace.yaml

# 3. Create secrets
kubectl apply -f k8s/secrets.yaml -n taskmanager

# 4. Deploy PostgreSQL
kubectl apply -f k8s/postgres-pvc.yaml -n taskmanager
kubectl apply -f k8s/postgres-deployment.yaml -n taskmanager
kubectl wait --for=condition=ready pod -l app=postgres -n taskmanager --timeout=300s

# 5. Deploy Backend
kubectl apply -f k8s/backend-deployment.yaml -n taskmanager
kubectl wait --for=condition=ready pod -l app=backend -n taskmanager --timeout=300s

# 6. Deploy Frontend
kubectl apply -f k8s/frontend-deployment.yaml -n taskmanager
kubectl wait --for=condition=ready pod -l app=frontend -n taskmanager --timeout=300s

# 7. Verify deployment
kubectl get all -n taskmanager
kubectl get svc -n taskmanager
```

### 16.9 EKS Cluster Management

```bash
# View all resources
kubectl get all -n taskmanager

# View logs
kubectl logs <pod-name> -n taskmanager
kubectl logs -f <pod-name> -n taskmanager  # Follow logs
kubectl logs -l app=backend -n taskmanager  # All backend pods

# Describe resources
kubectl describe pod <pod-name> -n taskmanager
kubectl describe service <service-name> -n taskmanager

# Scale deployment
kubectl scale deployment backend --replicas=3 -n taskmanager

# Update image
kubectl set image deployment/backend backend=saikiranasamwar4/taskmanager-backend:v2 -n taskmanager
kubectl rollout status deployment/backend -n taskmanager

# Rollback deployment
kubectl rollout undo deployment/backend -n taskmanager
kubectl rollout history deployment/backend -n taskmanager

# Restart deployment (without image change)
kubectl rollout restart deployment/backend -n taskmanager

# Delete specific resources
kubectl delete -f k8s/frontend-deployment.yaml -n taskmanager

# Cleanup everything in namespace
kubectl delete namespace taskmanager

# Delete cluster (complete cleanup)
eksctl delete cluster --name taskmanager-cluster --region us-east-1
```

**Common Kubernetes Troubleshooting Commands:**
```bash
# Check pod events
kubectl get events -n taskmanager --sort-by='.lastTimestamp'

# Debug pod
kubectl exec -it <pod-name> -n taskmanager -- /bin/sh

# Check logs for crashed pods
kubectl logs <pod-name> -n taskmanager --previous

# Port forward for testing
kubectl port-forward svc/backend 8888:8888 -n taskmanager
kubectl port-forward svc/frontend 8080:80 -n taskmanager

# Check resource usage
kubectl top nodes
kubectl top pods -n taskmanager
```

---

## Step 17: Setup CI/CD Pipeline

### 17.1 Understanding the Jenkinsfile

The project includes a `Jenkinsfile` that defines the complete CI/CD pipeline with the following stages:

**Pipeline Stages:**
1. **Checkout** - Clone source code from repository
2. **Build Backend** - Build Flask backend Docker image
3. **Build Frontend** - Build Nginx frontend Docker image
4. **Test** - Run integration tests with docker-compose
5. **Push to Registry** - Push images to DockerHub
6. **Deploy to Kubernetes** - Deploy to EKS cluster

**Kubernetes Resources Deployed:**
- Namespace (`taskmanager`)
- PostgreSQL (PVC, Deployment, Service, Secrets)
- Backend (Deployment, Service)
- Frontend (Deployment, Service with LoadBalancer)

**Prerequisites:**
- All credentials configured (DockerHub, AWS, GitHub, SonarQube)
- GitHub webhook configured for auto-trigger
- EKS cluster running and accessible
- kubectl configured with EKS cluster access

### 17.2 Review Jenkinsfile Configuration

Before creating the pipeline, review your `Jenkinsfile`:

```bash
# Open and review the Jenkinsfile
cat ~/Python-DevOps/Jenkinsfile
```

**Key Environment Variables in Jenkinsfile:**
```groovy
environment {
    DOCKER_REGISTRY = 'saikiranasamwar4'
    BACKEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-backend"
    FRONTEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-frontend"
    DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
    KUBECONFIG = credentials('kubeconfig')
}
```

**Update these values** if needed to match your configuration.

### 17.3 Create Jenkins Pipeline Job

1. Open Jenkins UI: `http://your-ec2-public-ip:8080`
2. Click **New Item** on the left sidebar
3. Enter name: `TaskManager-Deploy`
4. Select **Pipeline**
5. Click **OK**

### 17.4 Configure General Settings

**In the pipeline configuration page:**

1. **Description:**
   ```
   CI/CD pipeline for Task Manager application - builds Docker images and deploys to EKS
   ```

2. **Discard old builds:** (Recommended)
   - Check this option
   - Strategy: Log Rotation
   - Max # of builds to keep: `10`

### 17.5 Configure Build Triggers

**Enable GitHub Webhook:**
1. Under **Build Triggers** section
2. Check ☑ **GitHub hook trigger for GITScm polling**
3. This allows automatic builds when you push to GitHub

**Poll SCM (Alternative):**
- If webhook doesn't work, use: `H/5 * * * *` (checks every 5 minutes)

### 17.6 Configure Pipeline Definition

**Pipeline Section:**

1. **Definition:** Select **Pipeline script from SCM**

2. **SCM:** Select **Git**

3. **Repository URL:** Enter your GitHub repository URL
   ```
   https://github.com/your-username/Python-DevOps.git
   ```

4. **Credentials:**
   - If public repo: Select **- none -**
   - If private repo: Select **github-credentials** (configured in Step 10.4)

5. **Branches to build:**
   - Branch Specifier: `*/main`
   - Or use `*/master` if that's your default branch

6. **Script Path:** `Jenkinsfile`

7. **Lightweight checkout:** ☑ Check this (faster checkout)

### 17.7 Add Pipeline Parameters (Optional)

For more control, add build parameters:

1. Check ☑ **This project is parameterized**
2. Add parameters:

**String Parameter:**
- Name: `DOCKER_TAG`
- Default Value: `latest`
- Description: `Docker image tag to build and deploy`

**Choice Parameter:**
- Name: `DEPLOY_ENV`
- Choices: `production`, `staging`, `dev`
- Description: `Target environment`

**Boolean Parameter:**
- Name: `RUN_TESTS`
- Default: `true`
- Description: `Run integration tests`

### 17.8 Save and Verify Configuration

1. Click **Save** at the bottom
2. You'll be redirected to the pipeline dashboard
3. Verify all settings are correct

### 17.9 Run the Pipeline (First Build)

**Trigger Manual Build:**

1. Click **Build Now** on the left sidebar
2. A build will appear under **Build History**
3. Click on **#1** (build number)
4. Click **Console Output** to view real-time logs

**Expected Pipeline Flow:**
```
Started by user admin
[Pipeline] Start
[Pipeline] node
[Pipeline] stage (Checkout)
  ✓ Checking out code from repository...
  
[Pipeline] stage (Build Backend)
  ✓ Building Flask backend Docker image...
  ✓ Tagged as taskmanager-backend:latest
  
[Pipeline] stage (Build Frontend)
  ✓ Building Nginx frontend Docker image...
  ✓ Tagged as taskmanager-frontend:latest
  
[Pipeline] stage (Test)
  ✓ Starting docker-compose services...
  ✓ Testing frontend accessibility...
  ✓ Stopping services...
  
[Pipeline] stage (Push to Registry)
  ✓ Pushing backend image to DockerHub...
  ✓ Pushing frontend image to DockerHub...
  
[Pipeline] stage (Deploy to Kubernetes)
  ✓ Updating kubeconfig for EKS...
  ✓ Applying namespace...
  ✓ Applying secrets...
  ✓ Deploying PostgreSQL...
  ✓ Deploying backend...
  ✓ Deploying frontend...
  ✓ Waiting for deployments to be ready...
  
[Pipeline] End
SUCCESS - Build completed in 8m 30s
```

### 17.10 Monitor Pipeline Execution

**During Build:**
- Watch **Console Output** for real-time progress
- Each stage shows success ✓ or failure ✗
- Build progress bar shows overall completion

**After Build:**
1. **Status Indicator:**
   - ☀️ Blue/Green = Success
   - ⛈️ Red = Failure
   - ⚠️ Yellow = Unstable

2. **Check Stage View:**
   - Click on the build number
   - View graphical stage breakdown
   - See time taken for each stage

3. **Review Logs:**
   - Scroll through console output
   - Look for errors or warnings
   - Verify image tags and deployment status

### 17.11 Verify Deployment Success

**After successful pipeline run:**

```bash
# SSH to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Check EKS deployments
kubectl get deployments -n taskmanager

# Check if new images are deployed
kubectl describe deployment backend -n taskmanager | grep Image

# Check pod status
kubectl get pods -n taskmanager

# View recent pod logs
kubectl logs -n taskmanager deployment/backend --tail=50
```

**Expected Output:**
```
NAME       READY   UP-TO-DATE   AVAILABLE   AGE
backend    2/2     2            2           5m
frontend   2/2     2            2           5m
postgres   1/1     1            1           5m
```

### 17.12 Configure Pipeline Notifications (Optional)

**Add Email Notifications:**

1. Edit pipeline job → **Configure**
2. Add **Post-build Actions**
3. Select **Editable Email Notification**
4. Configure:
   - Recipients: `your-email@example.com`
   - Triggers: **Failure - Any**, **Success**

### 17.13 Automatic Builds via GitHub Webhook

**Test Webhook Trigger:**

1. Make a small change to your code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Test CI/CD trigger"
   git push origin main
   ```
3. Jenkins should automatically start a new build
4. Check **Build History** for new build number

**Troubleshoot Webhook:**
- Check Jenkins is accessible from internet (not localhost)
- Verify webhook URL: `http://your-ec2-public-ip:8080/github-webhook/`
- Check GitHub webhook delivery logs for errors
- Ensure security group allows port 8080

### 17.14 Pipeline Best Practices

**Security:**
- Never hardcode credentials in Jenkinsfile
- Use Jenkins credentials manager
- Rotate access tokens regularly
- Use minimal IAM permissions for AWS

**Performance:**
- Use Docker build cache
- Parallelize independent stages
- Clean workspace after builds
- Archive artifacts selectively

**Monitoring:**
- Review build trends regularly
- Set up failure alerts
- Monitor build duration
- Track deployment frequency

### 17.15 Common Pipeline Issues and Solutions

**Issue 1: Docker Login Failed**
```
Solution:
- Verify dockerhub-credentials in Jenkins
- Check DockerHub username/password
- Test login manually: docker login
```

**Issue 2: AWS EKS Access Denied**
```
Solution:
- Verify aws-credentials are correct
- Check IAM permissions
- Update kubeconfig: aws eks update-kubeconfig --name taskmanager-cluster
```

**Issue 3: Image Not Found**
```
Solution:
- Verify image was pushed to DockerHub
- Check image name matches in deployment YAML
- Ensure image tag is correct
```

**Issue 4: Deployment Timeout**
```
Solution:
- Check pod events: kubectl describe pod <pod-name>
- Verify container image can be pulled
- Check resource limits in deployment
```

**Issue 5: Webhook Not Triggering**
```
Solution:
- Check GitHub webhook delivery logs
- Verify Jenkins URL is accessible
- Ensure GitHub hook trigger is enabled in job
- Check firewall/security group rules
```

---

## Step 18: Verify Monitoring

### 18.1 Verify Prometheus

```bash
# Access Prometheus UI
# Browser: http://your-ec2-public-ip:9090

# Check if targets are UP
# Go to Status → Targets

# Run sample queries:
# - up (shows all targets)
# - rate(flask_http_request_total[5m])
# - process_resident_memory_bytes
```

### 18.2 Verify Grafana Dashboards

```bash
# Access Grafana UI
# Browser: http://your-ec2-public-ip:3000

# Login with admin credentials
# Verify Prometheus data source is connected (green check)

# Check dashboards:
# - Node Exporter Full (ID: 1860)
# - Task Manager Custom Dashboard (if imported)
```

### 18.3 Monitor Application Metrics

**Key Metrics to Monitor:**

1. **System Metrics (Node Exporter Dashboard):**
   - CPU Usage
   - Memory Usage
   - Disk I/O
   - Network Traffic

2. **Application Metrics (Backend):**
   - HTTP Request Rate: `rate(flask_http_request_total[5m])`
   - Response Time: `flask_http_request_duration_seconds`
   - Active Connections: `process_open_fds`
   - Memory Usage: `process_resident_memory_bytes`

3. **Database Metrics:**
   - PostgreSQL Connections
   - Query Duration
   - Transaction Rate

**Access URLs:**
- Prometheus: `http://your-ec2-public-ip:9090`
- Grafana: `http://your-ec2-public-ip:3000`

---

# SECTION C: REFERENCE

## Environment Variables

### Required Variables (.env file)

```bash
# Security
SECRET_KEY=<random-string-min-32-chars>

# Flask Configuration
FLASK_ENV=production
FLASK_APP=run.py

# Database
DATABASE_URL=postgresql://taskmanager:taskmanager123@postgres:5432/taskmanager_db

# For local development with SQLite (optional)
# DATABASE_URL=sqlite:///app.db
```

### Generate Secure Secrets

```bash
# Generate random secret key
python3 -c 'import secrets; print(secrets.token_hex(32))'

# Or using openssl
openssl rand -hex 32
```

---

## Troubleshooting

### Docker Issues

**Problem: Permission denied**
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Problem: Container won't start**
```bash
# Check logs
docker logs <container-name>

# Check if port is in use
sudo ss -tulpn | grep ':<port>'
```

**Problem: Can't connect to PostgreSQL**
```bash
# Check PostgreSQL container
docker ps | grep postgres

# Test connection
docker exec -it <postgres-container> psql -U taskmanager -d taskmanager_db

# Check logs
docker logs <postgres-container>
```

### Kubernetes Issues

**Problem: Pods in CrashLoopBackOff**
```bash
# Check pod logs
kubectl logs <pod-name> -n taskmanager

# Describe pod for events
kubectl describe pod <pod-name> -n taskmanager

# Check if images exist
docker pull saikiranasamwar4/taskmanager-backend:v1.0
```

**Problem: Service not accessible**
```bash
# Check service
kubectl get service <service-name> -n taskmanager

# Check endpoints
kubectl get endpoints <service-name> -n taskmanager

# Port forward for testing
kubectl port-forward service/<service-name> 8080:80 -n taskmanager
```

**Problem: LoadBalancer stuck in pending**
```bash
# Check service events
kubectl describe service frontend -n taskmanager

# Verify AWS Load Balancer Controller is installed
kubectl get deployment -n kube-system aws-load-balancer-controller

# Check pod events
kubectl get events -n taskmanager
```

### PostgreSQL Connection Issues

**Problem: Backend can't connect to PostgreSQL**
```bash
# Check PostgreSQL pod
kubectl get pods -l app=postgres -n taskmanager

# Check PostgreSQL logs
kubectl logs <postgres-pod-name> -n taskmanager

# Test DB connection using a temporary psql client pod (runs from your EC2 shell)
kubectl run psql-client \
   --rm -it \
   --restart=Never \
   --image=postgres:15-alpine \
   -n taskmanager \
   --env="PGPASSWORD=taskmanager123" \
   -- psql -h postgres -U taskmanager -d taskmanager_db
```

**Problem: Database initialization failed**
```bash
# Check if tables are created
kubectl exec -it <postgres-pod> -n taskmanager -- psql -U taskmanager -d taskmanager_db -c "\dt"

# Manually run migrations if needed
kubectl exec -it <backend-pod> -n taskmanager -- flask db upgrade
```

### Jenkins Issues

**Problem: Jenkins won't start**
```bash
# Check Java version
java -version

# Check Jenkins logs
sudo journalctl -u jenkins -f

# Check disk space
df -h

# Check Jenkins service
sudo systemctl status jenkins
```

**Problem: Jenkins can't connect to GitHub**
```bash
# Test SSH connection
ssh -T git@github.com

# Verify credentials in Jenkins
# Manage Jenkins → Credentials → Check github-credentials

# Test webhook delivery in GitHub
# Repository → Settings → Webhooks → Recent Deliveries
```

### EKS Issues

**Problem: kubectl can't connect to cluster**
```bash
# Update kubeconfig
aws eks update-kubeconfig --name taskmanager-cluster --region us-east-1

# Verify connection
kubectl cluster-info

# Check AWS credentials
aws sts get-caller-identity
```

**Problem: Node group not scaling**
```bash
# Check node group status
eksctl get nodegroup --cluster taskmanager-cluster

# Check autoscaler logs
kubectl logs -n kube-system deployment/cluster-autoscaler
```

### Application Issues

**Problem: Backend returns 500 error**
```bash
# Check backend logs
kubectl logs -n taskmanager deployment/backend --tail=100

# Check if database is accessible
kubectl exec -it <backend-pod> -n taskmanager -- env | grep DATABASE

# Test database connection
kubectl exec -it <backend-pod> -n taskmanager -- python3 -c "from flask import Flask; from flask_sqlalchemy import SQLAlchemy; print('DB OK')"
```

**Problem: Frontend shows blank page**
```bash
# Check nginx logs
kubectl logs -n taskmanager deployment/frontend --tail=50

# Verify nginx config
kubectl exec -it <frontend-pod> -n taskmanager -- cat /etc/nginx/conf.d/default.conf

# Check if files are copied
kubectl exec -it <frontend-pod> -n taskmanager -- ls -la /usr/share/nginx/html/
```

**Problem: API calls fail from frontend**
```bash
# Check browser console for errors
# Verify API endpoint configuration in frontend JavaScript files

# Check CORS configuration in Flask backend
# Ensure Flask-CORS is configured properly

# Test API directly
curl http://<backend-service-url>:8888/api/tasks
```

### Network Issues

**Problem: Can't access from browser**
```bash
# Check security group rules
aws ec2 describe-security-groups

# Check if service is listening
sudo ss -tulpn | grep ':<port>'

# Test from EC2
curl http://localhost:<port>

# Test LoadBalancer
curl http://<loadbalancer-dns>
```

---

## Quick Reference Commands

### Docker
```bash
docker ps                              # List running containers
docker logs <container>                # View logs
docker logs -f <container>             # Follow logs
docker exec -it <container> sh         # Shell into container
docker-compose up -d                   # Start services
docker-compose down                    # Stop services
docker-compose logs -f                 # Follow all logs
docker system prune -a                 # Clean up unused resources
docker volume ls                       # List volumes
docker network ls                      # List networks
```

### Kubernetes
```bash
kubectl get all -n taskmanager                     # List all resources
kubectl get pods -o wide -n taskmanager            # Detailed pod info
kubectl logs -f <pod> -n taskmanager               # Follow logs
kubectl exec -it <pod> -n taskmanager -- sh        # Shell into pod
kubectl delete pod <pod> -n taskmanager            # Delete pod
kubectl rollout restart deployment/<name> -n taskmanager  # Restart deployment
kubectl describe pod <pod> -n taskmanager          # Detailed pod info
kubectl get events -n taskmanager                  # Recent events
kubectl top nodes                                  # Node resource usage
kubectl top pods -n taskmanager                    # Pod resource usage
```

### AWS
```bash
aws eks list-clusters                              # List EKS clusters
aws eks update-kubeconfig --name <cluster>         # Update kubeconfig
aws ec2 describe-instances                         # List EC2 instances
aws elbv2 describe-load-balancers                  # List load balancers
eksctl get cluster                                 # Get cluster info
eksctl get nodegroup --cluster <name>              # Get node groups
```

### PostgreSQL
```bash
# Connect to PostgreSQL in container
docker exec -it <postgres-container> psql -U taskmanager -d taskmanager_db

# In Kubernetes
kubectl exec -it <postgres-pod> -n taskmanager -- psql -U taskmanager -d taskmanager_db

# Common SQL commands
\dt                    # List tables
\d <table>             # Describe table
\l                     # List databases
\du                    # List users
\q                     # Quit
```

### System
```bash
sudo systemctl status <service>        # Check service status
sudo systemctl restart <service>       # Restart service
sudo systemctl start <service>         # Start service
sudo systemctl stop <service>          # Stop service
sudo journalctl -u <service> -f        # View service logs
df -h                                  # Check disk space
free -h                                # Check memory
top                                    # Monitor processes
htop                                   # Better process monitor
ss -tlnp                               # List listening ports
```

---

## Project Structure

```
Python-DevOps/
├── backend/
│   ├── app/
│   │   ├── __init__.py            # Flask app initialization
│   │   ├── models.py              # SQLAlchemy models
│   │   └── routes.py              # API routes
│   ├── instance/                  # SQLite database (development)
│   ├── static/                    # Static files
│   ├── templates/                 # Jinja2 templates
│   ├── config.py                  # Configuration classes
│   ├── run.py                     # Application entry point
│   ├── utils.py                   # Utility functions
│   ├── requirements.txt           # Python dependencies
│   └── Dockerfile                 # Backend container image
├── frontend/
│   ├── css/
│   │   └── style.css              # Stylesheet
│   ├── js/
│   │   ├── app.js                 # Main JavaScript
│   │   ├── auth.js                # Authentication logic
│   │   ├── dashboard.js           # Dashboard functionality
│   │   ├── tasks.js               # Task management
│   │   ├── calendar.js            # Calendar view
│   │   ├── analytics.js           # Analytics dashboard
│   │   ├── reports.js             # Reporting functionality
│   │   ├── users.js               # User management
│   │   ├── profile.js             # User profile
│   │   ├── settings.js            # Settings page
│   │   ├── notifications.js       # Notifications
│   │   ├── theme.js               # Theme switcher
│   │   ├── lead-dashboard.js      # Team lead dashboard
│   │   └── member-dashboard.js    # Member dashboard
│   ├── templates/
│   │   ├── index.html             # Landing page
│   │   ├── login.html             # Login page
│   │   ├── register.html          # Registration page
│   │   ├── dashboard.html         # Main dashboard
│   │   ├── lead-dashboard.html    # Team lead view
│   │   ├── member-dashboard.html  # Team member view
│   │   ├── tasks.html             # Task management
│   │   ├── calendar.html          # Calendar view
│   │   ├── analytics.html         # Analytics page
│   │   ├── reports.html           # Reports page
│   │   ├── users.html             # User management
│   │   ├── profile.html           # User profile
│   │   ├── settings.html          # Settings page
│   │   └── notifications.html     # Notifications
│   ├── nginx.conf                 # Nginx configuration
│   └── Dockerfile                 # Frontend container image
├── k8s/
│   ├── namespace.yaml             # Kubernetes namespace
│   ├── secrets.yaml               # PostgreSQL secrets
│   ├── postgres-pvc.yaml          # Persistent volume claim
│   ├── postgres-deployment.yaml   # PostgreSQL deployment
│   ├── backend-deployment.yaml    # Backend deployment
│   ├── frontend-deployment.yaml   # Frontend deployment
│   └── ingress.yaml               # Ingress configuration
├── jenkins/
│   ├── jenkins-deployment.yaml    # Jenkins K8s deployment
│   └── jenkins-rbac.yaml          # Jenkins RBAC
├── monitoring/
│   ├── prometheus-config.yaml     # Prometheus configuration
│   ├── prometheus-deployment.yaml # Prometheus deployment
│   ├── prometheus-rbac.yaml       # Prometheus RBAC
│   ├── grafana-deployment.yaml    # Grafana deployment
│   ├── grafana-datasource.yaml    # Grafana datasource config
│   ├── grafana-dashboard-config.yaml  # Dashboard ConfigMap
│   └── grafana-dashboard.json     # Custom dashboard
├── docker-compose.yml             # Docker Compose configuration
├── Jenkinsfile                    # CI/CD pipeline definition
└── README.md                      # This file
```

---

## Application Features

### User Roles
- **Admin** - Full system access, user management
- **Team Lead** - Team management, task assignment, reporting
- **Member** - Personal task management, team collaboration

### Core Features
- ✅ User authentication and authorization
- ✅ Role-based access control (RBAC)
- ✅ Task creation, assignment, and tracking
- ✅ Team collaboration and communication
- ✅ Calendar view for task scheduling
- ✅ Analytics and reporting dashboard
- ✅ Real-time notifications
- ✅ User profile management
- ✅ Theme customization (light/dark mode)
- ✅ Responsive design for mobile and desktop

### Technology Stack
- **Backend:** Flask 3.0, SQLAlchemy, Gunicorn
- **Frontend:** Vanilla JavaScript, HTML5, CSS3, Nginx
- **Database:** PostgreSQL 15
- **Authentication:** Session-based with Flask sessions
- **Containerization:** Docker, Docker Compose
- **Orchestration:** Kubernetes (EKS)
- **CI/CD:** Jenkins
- **Monitoring:** Prometheus, Grafana
- **Code Quality:** SonarQube

---

## API Endpoints

### Authentication
```
POST   /api/auth/register      # User registration
POST   /api/auth/login         # User login
POST   /api/auth/logout        # User logout
GET    /api/auth/me            # Get current user
```

### Tasks
```
GET    /api/tasks              # Get all tasks
POST   /api/tasks              # Create new task
GET    /api/tasks/:id          # Get task by ID
PUT    /api/tasks/:id          # Update task
DELETE /api/tasks/:id          # Delete task
```

### Users
```
GET    /api/users              # Get all users (admin only)
GET    /api/users/:id          # Get user by ID
PUT    /api/users/:id          # Update user
DELETE /api/users/:id          # Delete user (admin only)
```

### Teams
```
GET    /api/teams              # Get all teams
POST   /api/teams              # Create team (lead/admin)
GET    /api/teams/:id          # Get team by ID
PUT    /api/teams/:id          # Update team
DELETE /api/teams/:id          # Delete team
```

---

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use AWS Secrets Manager or Parameter Store for production
   - Rotate secrets regularly

2. **Database Security:**
   - Use strong passwords
   - Enable SSL/TLS for database connections
   - Implement database backups

3. **Network Security:**
   - Use security groups to restrict access
   - Enable VPC for EKS cluster
   - Implement network policies in Kubernetes

4. **Application Security:**
   - Implement rate limiting
   - Use HTTPS/TLS for all connections
   - Sanitize user inputs
   - Implement CSRF protection

---

## Performance Optimization

1. **Database:**
   - Add indexes on frequently queried columns
   - Use connection pooling
   - Implement query caching

2. **Application:**
   - Use Gunicorn with multiple workers
   - Implement Redis for session storage
   - Enable gzip compression in Nginx

3. **Infrastructure:**
   - Use autoscaling for EKS node groups
   - Implement horizontal pod autoscaling
   - Use CDN for static assets

---

## Backup and Recovery

### Database Backup
```bash
# Manual backup
kubectl exec -it <postgres-pod> -n taskmanager -- pg_dump -U taskmanager taskmanager_db > backup.sql

# Restore from backup
kubectl exec -i <postgres-pod> -n taskmanager -- psql -U taskmanager taskmanager_db < backup.sql
```

### Automated Backups
- Configure AWS RDS automated backups
- Use Velero for Kubernetes cluster backups
- Implement daily backup cron jobs

---

## Monitoring and Alerts

### Prometheus Alerts
Configure alerts for:
- High CPU/Memory usage
- Pod crash loops
- Service downtime
- Database connection failures
- High error rates

### Grafana Dashboards
Key metrics to monitor:
- Request rate and latency
- Error rate
- Resource utilization
- Database connections
- Active users

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact: your-email@example.com

---

## Acknowledgments

- Flask documentation
- Kubernetes documentation
- AWS EKS best practices
- Docker best practices
- Jenkins documentation
- Prometheus and Grafana communities

---

**Last Updated:** December 30, 2025
**Version:** 1.0.0
**Maintainer:** Your Name
