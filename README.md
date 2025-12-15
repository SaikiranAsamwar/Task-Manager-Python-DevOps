# 🐳 EC2 Python Docker Deployment Guide

This repository demonstrates a **production-ready, Dockerized full-stack application deployment on AWS EC2 (Amazon Linux)** using **Docker and Docker Compose**. Perfect for DevOps engineers, cloud architects, and portfolio builders.

**Key Features:**
- ✅ Complete Docker containerization setup
- ✅ Single-command deployment (5 steps)
- ✅ PostgreSQL database with persistence
- ✅ Flask backend API
- ✅ Static frontend with Node.js http-server
- ✅ Health checks and monitoring ready
- ✅ Production-friendly configuration

---

## 📌 Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Frontend** | Node.js `http-server` | 18 |
| **Backend** | Python Flask | 3.11+ |
| **Database** | PostgreSQL | 15 |
| **Containerization** | Docker & Docker Compose | Latest |
| **Cloud** | AWS EC2 | Amazon Linux 2023 |
| **Networking** | Docker Bridge Network | User-defined |

---

## 📁 Project Structure

```text
EC2-Python-Docker/
│
├── docker-compose.yml              # Orchestration configuration
├── DOCKER_DEPLOYMENT_AWS.md        # Detailed deployment guide
├── README.md                        # This file
│
├── backend/                         # Flask REST API
│   ├── Dockerfile                   # Backend container image
│   ├── requirements.txt             # Python dependencies
│   ├── config.py                    # Flask configuration
│   ├── run.py                       # Application entry point
│   ├── utils.py                     # Utility functions
│   └── app/
│       ├── __init__.py              # Flask app initialization
│       ├── models.py                # Database models
│       └── routes.py                # API endpoints
│
└── frontend/                        # Static web application
    ├── Dockerfile                   # Frontend container image
    ├── templates/                   # HTML templates
    │   ├── index.html               # Main entry point
    │   ├── dashboard.html
    │   ├── login.html
    │   └── *.html                   # Other pages
    ├── css/
    │   └── style.css                # Styling
    └── js/
        ├── app.js                   # Main application logic
        ├── auth.js                  # Authentication
        └── *.js                     # Feature modules
```

---

## � Prerequisites

### Local Development
- Git installed
- Basic understanding of Docker concepts
- Text editor or IDE
- Terminal/PowerShell access

### AWS EC2 Instance
- AWS account with EC2 permissions
- EC2 instance running **Amazon Linux 2023** (t3.micro or larger)
- Security group with inbound rules:
  - SSH (Port 22) - from your IP
  - HTTP (Port 80) - from 0.0.0.0/0 (optional, with reverse proxy)
  - Custom TCP (Port 3000) - from 0.0.0.0/0 (Frontend)
  - Custom TCP (Port 5000) - from 0.0.0.0/0 (Backend)
  - Custom TCP (Port 5432) - from 0.0.0.0/0 (Database, restrict in production)
- 20 GB EBS storage minimum
- SSH key pair downloaded

---

## 🚀 Quick Start (5 Steps)

For experienced users, here's the fastest path:

```bash
# 1. Update and install essentials
sudo yum update -y && sudo yum install git docker -y

# 2. Start Docker
sudo systemctl start docker && sudo systemctl enable docker

# 3. Clone the repository
git clone https://github.com/SaikiranAsamwar/EC2-Python-Docker.git
cd EC2-Python-Docker

# 4. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 5. Deploy!
sudo docker-compose up -d --build
```

✅ **Done!** Your application is live at:
- **Frontend**: http://<YOUR_EC2_IP>:3000
- **Backend**: http://<YOUR_EC2_IP>:5000

---

## 🚀 Detailed Deployment Steps (From Scratch)

### 1️⃣ Update System & Install Dependencies

```bash
sudo yum update -y
sudo yum install git -y
sudo yum install docker -y
```

Verify installations:
```bash
git --version
docker --version
python3 --version
```

---

### 2️⃣ Start & Enable Docker

```bash
sudo systemctl start docker
sudo systemctl enable docker
sudo systemctl status docker
```

---

### 3️⃣ Clone Repository

```bash
git clone https://github.com/SaikiranAsamwar/EC2-Python-Docker.git
cd EC2-Python-Docker
```

---

### 4️⃣ Install Docker Compose

```bash
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
-o /usr/local/bin/docker-compose

sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
```

---

### 5️⃣ Build & Run Application

```bash
sudo docker-compose up -d --build
```

Check running containers:
```bash
sudo docker ps
```

---

## 🌐 Access the Application

Once deployed, access your services using your EC2 instance's public IP:

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://<EC2_PUBLIC_IP>:3000 | Web UI |
| **Backend** | http://<EC2_PUBLIC_IP>:5000 | REST API |
| **Database** | <EC2_PRIVATE_IP>:5432 | PostgreSQL (internal only) |

### Finding Your EC2 Public IP

```bash
# From EC2 instance terminal
curl http://169.254.169.254/latest/meta-data/public-ipv4

# Or from AWS Console
# EC2 → Instances → Select your instance → Copy "Public IPv4 address"
```

> ⚠️ **Important**: Ensure your EC2 Security Group allows inbound traffic on **ports 3000, 5000, and 5432**

---

## 🔁 Common Docker Compose Commands

```bash
# Start services in the background
sudo docker-compose up -d --build

# Stop all services
sudo docker-compose down

# Restart services
sudo docker-compose restart

# View logs (all services)
sudo docker-compose logs -f

# View logs (specific service)
sudo docker-compose logs -f backend
sudo docker-compose logs -f frontend
sudo docker-compose logs -f db

# Check running containers
sudo docker-compose ps

# Execute command in container
sudo docker-compose exec backend flask db upgrade
sudo docker-compose exec db pg_dump -U devops_user devops_db > backup.sql

# Rebuild images without cache
sudo docker-compose build --no-cache

# Remove all containers and volumes
sudo docker-compose down -v
```

---

## 🧪 Testing Deployment

### Verify Services Are Running

```bash
# Check containers
sudo docker-compose ps

# Expected output:
# NAME                COMMAND                   STATUS
# devops-frontend     "http-server templates..." Up
# devops-backend      "python run.py"           Up
# devops-db          "postgres"                 Up
```

### Test API Connectivity

```bash
# Test backend
curl http://localhost:5000

# Test frontend
curl http://localhost:3000

# View database logs
sudo docker-compose logs db
```

---

## 🌍 Environment Configuration

### Default Credentials

The application comes with default development credentials in `docker-compose.yml`:

```yaml
Database:
  User: devops_user
  Password: devops_password
  Database: devops_db
  Port: 5432
```

### For Production

⚠️ **Never use defaults in production!** Instead:

1. Create a `.env` file in project root:
   ```bash
   POSTGRES_USER=secure_username
   POSTGRES_PASSWORD=$(openssl rand -base64 32)
   POSTGRES_DB=production_db
   FLASK_ENV=production
   SECRET_KEY=$(openssl rand -hex 32)
   ```

2. Update `docker-compose.yml` to reference `.env`

3. **Do NOT commit `.env` to Git**

4. Use AWS Secrets Manager for sensitive data

---

## 🚨 Troubleshooting

### Issue: "Permission denied" when running docker commands

**Solution**: Add your user to docker group
```bash
sudo usermod -a -G docker $USER
newgrp docker
# Log out and back in
```

### Issue: Port already in use

**Solution**: Find and stop the conflicting process
```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: Database connection failed

**Solution**: Restart the database container
```bash
sudo docker-compose restart db
sudo docker-compose logs db
```

### Issue: Frontend shows "Index of /" instead of webpage

**Solution**: The Dockerfile is configured to serve from the `templates/` directory
```bash
# Rebuild the frontend
sudo docker-compose build --no-cache frontend
sudo docker-compose restart frontend
```

### Issue: Out of disk space

**Solution**: Clean up Docker resources
```bash
# Remove unused containers, images, and volumes
docker system prune -a --volumes

# Check disk usage
df -h
```

### Issue: Cannot access application from browser

**Solution**: Check security group rules and firewall
```bash
# Verify services are running
sudo docker-compose ps

# Test from instance
curl http://localhost:3000
curl http://localhost:5000

# Check AWS Console: EC2 → Security Groups → Verify inbound rules
```

---

## ⚠️ Best Practices & Security

### Development vs Production

| Aspect | Development | Production |
|--------|-------------|-----------|
| Image Tags | `latest` | Specific versions (e.g., `3.11`, `15`) |
| Logging | Verbose | Configured level |
| Network | All ports exposed | Only necessary ports |
| Credentials | Hardcoded (demo) | AWS Secrets Manager |
| Database | Container volume | RDS or managed service |
| Frontend | http-server | Nginx with SSL |
| Monitoring | Basic logs | CloudWatch, Prometheus |

### Security Checklist

- ✅ Use `.env` files (not in Git) for sensitive data
- ✅ Always use explicit image versions
- ✅ Restrict database ports to internal network only
- ✅ Enable HTTPS with SSL certificates
- ✅ Use strong passwords (generate with `openssl rand -base64 32`)
- ✅ Enable Docker Content Trust
- ✅ Backup database regularly
- ✅ Monitor container logs and CloudWatch
- ✅ Update base images regularly
- ✅ Use read-only filesystems where possible

### For Production Deployment

```bash
# Generate strong passwords
openssl rand -base64 32

# Use AWS Secrets Manager
aws secretsmanager create-secret --name mydb-credentials --secret-string '{"username":"admin","password":"secure-password"}'

# Enable HTTPS with Let's Encrypt (requires Nginx)
sudo yum install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d yourdomain.com
```

---

## 🧠 Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│          AWS EC2 Instance (Amazon Linux)             │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │  Docker Compose (devops_network)             │   │
│  │                                               │   │
│  │  ┌──────────────┐  ┌──────────────┐         │   │
│  │  │   Frontend   │  │   Backend    │         │   │
│  │  │ (Port 3000)  │  │ (Port 5000)  │         │   │
│  │  │ http-server  │  │  Flask API   │         │   │
│  │  └──────────────┘  └──────────────┘         │   │
│  │         │               │                    │   │
│  │         └───────┬───────┘                   │   │
│  │                 │                            │   │
│  │         ┌───────▼────────┐                 │   │
│  │         │   Database     │                 │   │
│  │         │ PostgreSQL 15  │                 │   │
│  │         │  (Port 5432)   │                 │   │
│  │         └────────────────┘                 │   │
│  │                 │                            │   │
│  │         ┌───────▼────────┐                 │   │
│  │         │  db_data Volume│ (Persistent)   │   │
│  │         └────────────────┘                 │   │
│  │                                               │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

**Communication Flow:**
- **Frontend** → calls `/api/*` endpoints → **Backend**
- **Backend** → SQL queries → **Database**
- All containers connected via `devops_network` bridge
- Data persisted in Docker volume `db_data`

---

## 📊 Monitoring & Health Checks

### View Real-time Logs

```bash
# All services
sudo docker-compose logs -f

# With timestamps
sudo docker-compose logs --timestamps -f

# Last 100 lines
sudo docker-compose logs --tail=100
```

### Monitor Resource Usage

```bash
# Real-time container stats
docker stats

# Container details
docker inspect devops-backend
```

### Database Health

```bash
# Check PostgreSQL status
sudo docker-compose exec db pg_isready -U devops_user

# Connect to database
sudo docker-compose exec db psql -U devops_user -d devops_db

# List tables
sudo docker-compose exec db psql -U devops_user -d devops_db -c "\dt"
```

---

## ❓ FAQ

**Q: Can I run this on t3.micro (free tier)?**
A: Yes, but performance will be limited. t3.small or larger recommended.

**Q: How do I backup my database?**
A: `docker-compose exec db pg_dump -U devops_user devops_db > backup.sql`

**Q: Can I use this setup for production?**
A: With modifications: use Nginx for frontend, RDS for database, Secrets Manager for credentials, and enable HTTPS.

**Q: How do I update the application?**
A: Pull changes, rebuild, and restart: `git pull && docker-compose up -d --build`

**Q: Can I add more services?**
A: Yes, add new services to `docker-compose.yml` and rebuild.

**Q: What if I need to change ports?**
A: Edit `docker-compose.yml` and update the `ports:` section, then restart.

---

## 🧠 Architecture Explanation

- Docker Compose orchestrates **three containers**:
  - Frontend
  - Backend
  - PostgreSQL database
- Containers communicate over a **user-defined bridge network**
- Persistent data is stored using **Docker volumes**

---

## 👨‍💻 Author & Support

**Saikiran Rajesh Asamwar**  
AWS DevOps Engineer | Docker Enthusiast

- **GitHub**: https://github.com/SaikiranAsamwar  
- **Docker Hub**: https://hub.docker.com/u/saikiranasamwar4  
- **LinkedIn**: [Your LinkedIn if applicable]

### Getting Help

1. **Documentation**: See [DOCKER_DEPLOYMENT_AWS.md](./DOCKER_DEPLOYMENT_AWS.md) for detailed deployment guide
2. **Logs**: Check `docker-compose logs` for error messages
3. **Docker Docs**: https://docs.docker.com/
4. **AWS Docs**: https://docs.aws.amazon.com/ec2/

### Contributing

Found a bug? Have a suggestion? Feel free to:
1. Open an issue on GitHub
2. Submit a pull request
3. Contact the author

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

## ✅ Deployment Checklist

Before deploying to production, ensure:

- [ ] Updated default credentials in `.env`
- [ ] Security group rules are restrictive
- [ ] SSL/HTTPS configured with Nginx
- [ ] Database backups automated
- [ ] Monitoring and logging enabled
- [ ] CloudWatch alarms configured
- [ ] Application tested thoroughly
- [ ] `.env` file not committed to Git
- [ ] Dockerfile tested and optimized
- [ ] Team members trained on deployment

---

## 🎯 Success Outcomes

✔ **Clean Docker-based deployment**  
✔ **Single-command setup (5 steps)**  
✔ **Cloud-ready architecture**  
✔ **Fully containerized application**  
✔ **Scalable and maintainable**  
✔ **Production-ready practices**  
✔ **Portfolio showcase-ready**  
✔ **Interview-ready explanation**

---

## 📚 Additional Resources

- [Docker Official Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Amazon Linux 2023 Documentation](https://docs.aws.amazon.com/linux/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Node.js http-server](https://www.npmjs.com/package/http-server)

---

**Last Updated**: December 2025  
**Status**: Active & Maintained ✅  
