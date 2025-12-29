# Project Question Bank (Task Manager – Flask + PostgreSQL + Docker + Kubernetes + Jenkins + SonarQube + Monitoring)

This file contains:
- **20 MCQ (multiple-choice)** questions (with answers)
- **20 scenario-based** questions (with answers)
- **20 overall** questions (with answers)

---

## 1) 20 MCQ Questions (with answers)

**MCQ 1.** In this project, what is the most common reason to run the Flask app behind **Gunicorn** instead of using `python run.py` in production?
- A. Gunicorn automatically creates database tables
- B. Gunicorn provides a production-grade WSGI server with worker processes
- C. Gunicorn replaces Nginx in the frontend
- D. Gunicorn is required for PostgreSQL connectivity
- **Answer:** B

**MCQ 2.** Which Kubernetes object is primarily responsible for keeping the desired number of backend pods running?
- A. Service
- B. Ingress
- C. Deployment
- D. ConfigMap
- **Answer:** C

**MCQ 3.** In Kubernetes, what is the main purpose of a **Service** for the backend?
- A. Build Docker images
- B. Provide stable networking (DNS/virtual IP) to access pods
- C. Store secrets securely
- D. Enforce RBAC rules
- **Answer:** B

**MCQ 4.** Which file typically defines local multi-container orchestration for development/testing?
- A. `k8s/backend-deployment.yaml`
- B. `docker-compose.yml`
- C. `frontend/nginx.conf`
- D. `Jenkinsfile`
- **Answer:** B

**MCQ 5.** What is the best reason to avoid Docker image tags like `latest` in Kubernetes production deployments?
- A. `latest` tags use more disk storage
- B. `latest` tags prevent Services from working
- C. `latest` tags make deployments non-deterministic and harder to roll back
- D. `latest` tags cannot be pulled from DockerHub
- **Answer:** C

**MCQ 6.** What does `automountServiceAccountToken: false` do in a Kubernetes Pod spec?
- A. Prevents the pod from receiving any environment variables
- B. Prevents mounting of the default service account token into the pod
- C. Forces the pod to run as root
- D. Disables liveness probes
- **Answer:** B

**MCQ 7.** In CI/CD, what is the main purpose of a **SonarQube Quality Gate** stage?
- A. Push Docker images
- B. Block promotion/deployment if code quality/security thresholds fail
- C. Configure Kubernetes Ingress
- D. Create Kubernetes namespaces
- **Answer:** B

**MCQ 8.** Which Kubernetes resource is typically used to expose HTTP routes externally (often via a Load Balancer controller)?
- A. Deployment
- B. StatefulSet
- C. Ingress
- D. Secret
- **Answer:** C

**MCQ 9.** What is the main role of Prometheus in the monitoring stack?
- A. Rendering dashboards
- B. Collecting metrics by scraping targets
- C. Storing application source code
- D. Building Docker images
- **Answer:** B

**MCQ 10.** What is the main role of Grafana in this stack?
- A. Collecting metrics from pods
- B. Creating Kubernetes namespaces
- C. Visualizing data from Prometheus via dashboards
- D. Acting as a reverse proxy for Flask
- **Answer:** C

**MCQ 11.** Which Kubernetes object is most appropriate to store sensitive values like database passwords?
- A. ConfigMap
- B. Secret
- C. Deployment
- D. ServiceAccount
- **Answer:** B

**MCQ 12.** What is a common reason to define **resource requests and limits** for CPU/memory?
- A. To increase Docker build speed
- B. To control scheduling and prevent noisy-neighbor resource exhaustion
- C. To disable readiness probes
- D. To avoid needing a Service
- **Answer:** B

**MCQ 13.** In `docker-compose.yml`, what does mapping `80:80` typically mean for the frontend container?
- A. Container port 80 is exposed on host port 80
- B. Host port 80 is exposed on container port 80
- C. It limits CPU to 80 cores
- D. It sets HTTP status to 80
- **Answer:** A

**MCQ 14.** If the backend uses `DATABASE_URL` for SQLAlchemy, what is the most likely symptom when it’s wrong?
- A. Nginx fails to start
- B. Flask app fails to connect to DB, raising connection/auth errors
- C. Docker daemon stops working
- D. Kubernetes namespace gets deleted
- **Answer:** B

**MCQ 15.** In Kubernetes, why would PostgreSQL commonly require a PVC?
- A. To expose the DB externally
- B. To persist data across pod restarts/rescheduling
- C. To increase the number of replicas
- D. To enable Ingress
- **Answer:** B

**MCQ 16.** What does `kubectl rollout status deployment/backend -n taskmanager` check?
- A. Whether Docker images exist locally
- B. Whether the Deployment update has successfully completed
- C. Whether the node has enough disk space
- D. Whether the Ingress is configured
- **Answer:** B

**MCQ 17.** In Jenkins pipelines, why is “Checkout” (Git stage) typically first?
- A. Jenkins requires it to start Docker
- B. Builds/scans need the source code and repo metadata
- C. It automatically configures kubectl
- D. It creates Kubernetes PVCs
- **Answer:** B

**MCQ 18.** Which of the following is the best place to store production secrets?
- A. Hard-coded in `docker-compose.yml`
- B. Hard-coded in `k8s/secrets.yaml` committed to Git
- C. External secret manager (e.g., AWS Secrets Manager) integrated with Kubernetes
- D. In a public GitHub Gist
- **Answer:** C

**MCQ 19.** In a typical Flask app factory pattern, `create_app()` helps by:
- A. Starting a Kubernetes cluster
- B. Creating the database server
- C. Encapsulating app configuration and extensions initialization
- D. Building Docker images
- **Answer:** C

**MCQ 20.** What is the primary advantage of using namespaces like `taskmanager` and `monitoring`?
- A. Faster Docker builds
- B. Logical isolation and simpler RBAC/resource separation
- C. Automatic SSL certificates
- D. Lower AWS billing
- **Answer:** B

---

## 2) 20 Scenario-Based Questions (with answers)

**Scenario 1.** The frontend loads, but API calls fail with `502 Bad Gateway`.
- **Answer:** Validate Ingress routes/service names, confirm backend Service endpoints exist (`kubectl get endpoints -n taskmanager`), ensure backend pods are Ready, and check backend container port/service targetPort. Also verify backend health route and timeouts.

**Scenario 2.** Backend pods crash with database connection errors right after deployment.
- **Answer:** Confirm `k8s/secrets.yaml` values and `DATABASE_URL` match the Service name (`postgres`) and credentials. Verify Postgres pod is ready and Service is reachable from the backend (`kubectl exec` into a backend pod and test DNS/port).

**Scenario 3.** Jenkins “Docker Push” fails with authentication errors.
- **Answer:** Validate DockerHub credentials ID (`dockerhub-credentials`) in Jenkins, ensure the credential user/token is correct, and confirm Jenkins agent has Docker CLI available.

**Scenario 4.** SonarQube stage passes locally but fails in Jenkins with “sonar-scanner: not found”.
- **Answer:** Install SonarScanner on the Jenkins agent or use a Jenkins tool installation / container agent that includes it. Ensure `withSonarQubeEnv('SonarQube')` points to a configured SonarQube server in Jenkins.

**Scenario 5.** Postgres data disappears after a node restart.
- **Answer:** Ensure PostgreSQL uses a PVC and that the PersistentVolume is correctly provisioned (and not `emptyDir`). Validate storage class, PVC bound status, and Postgres volume mounts.

**Scenario 6.** `kubectl apply` works, but pods stay in `Pending`.
- **Answer:** Check node capacity and resource requests/limits; `kubectl describe pod` to see scheduling constraints. Confirm the cluster has enough CPU/memory/ephemeral-storage and a compatible node selector/taints tolerations if used.

**Scenario 7.** Prometheus is running, but it shows “Target down” for the backend.
- **Answer:** Verify scrape config labels/targets, Service discovery config, and backend metrics endpoint. Confirm the metrics port/path is reachable from Prometheus. Check network policies (if any).

**Scenario 8.** Grafana deploys but dashboards are missing.
- **Answer:** Ensure dashboard provisioning ConfigMap is mounted correctly and the JSON is valid. Confirm Grafana has permissions to read the mounted files and that the provisioning path matches Grafana’s expected directory.

**Scenario 9.** Jenkins deploy stage fails: “namespace monitoring not found”.
- **Answer:** Add a namespace creation step before applying monitoring manifests: `kubectl create namespace monitoring --dry-run=client -o yaml | kubectl apply -f -`.

**Scenario 10.** Backend rollout never completes; `kubectl rollout status` times out.
- **Answer:** Inspect pod events/logs (`kubectl describe pod`, `kubectl logs`). Common causes: wrong image tag, failing readiness probe, DB unreachable, missing env vars, or insufficient resources.

**Scenario 11.** You want zero downtime deployment for backend updates.
- **Answer:** Use a Deployment rolling update strategy (default), set readiness probes properly so traffic only routes to healthy pods, and ensure at least 2 replicas so one stays available during rollout.

**Scenario 12.** Security team flags committed Kubernetes secrets in Git.
- **Answer:** Move secrets to a secret manager (AWS Secrets Manager / SSM Parameter Store) and use External Secrets Operator or CSI driver; rotate credentials immediately; remove secrets from Git history if required.

**Scenario 13.** Docker build works locally but fails in Jenkins due to missing permissions.
- **Answer:** Ensure Jenkins agent user has permission to access Docker daemon (e.g., docker group on Linux) or run builds inside a privileged Docker-in-Docker agent where appropriate.

**Scenario 14.** API latency spikes after deploying to Kubernetes.
- **Answer:** Check resource limits (CPU throttling), DB performance, Nginx buffering/timeouts, and pod autoscaling configuration (HPA). Inspect metrics in Prometheus/Grafana.

**Scenario 15.** Ingress is created but external URL returns 404.
- **Answer:** Verify Ingress rules/path routing match your frontend/backend paths and service names. Check the Ingress controller (e.g., AWS ALB controller) is installed and has correct annotations.

**Scenario 16.** You need to run a database migration before backend deploy.
- **Answer:** Add a Jenkins stage (or Kubernetes Job) to run migrations against PostgreSQL before rolling out backend. Ensure idempotency and safe rollback.

**Scenario 17.** `docker-compose up` passes, but Kubernetes deployment fails.
- **Answer:** Compare environment variables, networking (service DNS), storage (PVC), and image tags. Kubernetes adds scheduling/resource constraints and requires correct service discovery names.

**Scenario 18.** Pod logs show `Permission denied` when writing to a mounted volume.
- **Answer:** Validate securityContext (runAsUser/fsGroup) and volume permissions. Ensure the container user can write to the mounted path.

**Scenario 19.** Backend can’t resolve `postgres` hostname in Kubernetes.
- **Answer:** Ensure Postgres Service exists in the same namespace (`taskmanager`) and has correct name. Confirm DNS works and that backend uses `postgres` (service name) not `localhost`.

**Scenario 20.** You want to deploy to a new environment (staging) with minimal changes.
- **Answer:** Use separate namespaces (e.g., `taskmanager-staging`) and environment-specific values (different secrets, ingress hostnames). Keep manifests parameterized (Helm/Kustomize) or maintain separate overlays.

---

## 3) 20 Overall Questions (with answers)

**Q1. What are the main components of this project stack?**
- **A:** Flask backend, Nginx frontend, PostgreSQL database, Docker containers, Kubernetes manifests, Jenkins CI/CD, SonarQube scanning, Prometheus + Grafana monitoring.

**Q2. Why use Docker here?**
- **A:** To package the backend/frontend with consistent dependencies and runtime, enabling reproducible builds and deployments.

**Q3. Why use Kubernetes instead of only Docker Compose?**
- **A:** Kubernetes provides scaling, self-healing, rolling updates, service discovery, and cloud-native deployment patterns.

**Q4. What does the `taskmanager` namespace do?**
- **A:** Isolates application resources (pods/services/secrets) from other workloads.

**Q5. What does the monitoring namespace contain?**
- **A:** Prometheus, Grafana, and related ConfigMaps/RBAC/PVCs for observability.

**Q6. What is the purpose of `k8s/secrets.yaml`?**
- **A:** Stores sensitive values like DB URL and secret keys for Kubernetes workloads.

**Q7. Why is a PVC used for PostgreSQL?**
- **A:** Database data must persist even if the pod restarts or moves to another node.

**Q8. What is the role of Ingress in this project?**
- **A:** Routes external HTTP traffic to frontend/backend services based on host/path rules.

**Q9. What is the difference between a Deployment and a Service?**
- **A:** Deployment manages pods/replicas and rollouts; Service provides stable network access to pods.

**Q10. What is a “Quality Gate” in SonarQube?**
- **A:** A policy that fails the pipeline if code metrics (bugs, vulnerabilities, coverage) are below threshold.

**Q11. How do you verify backend is healthy in Kubernetes?**
- **A:** Check pod readiness, view logs, and call the backend endpoint via service/ingress; use `kubectl get pods` and `kubectl rollout status`.

**Q12. Why tag Docker images with a version like `v1.0`?**
- **A:** Ensures repeatable deployments, makes rollback easier, and avoids ambiguity of `latest`.

**Q13. What is the typical deployment order in this project?**
- **A:** Namespace → secrets → database PVC/deployment → backend → frontend → ingress → monitoring.

**Q14. What causes “CrashLoopBackOff” most often in this stack?**
- **A:** Bad env vars/secrets, DB connectivity issues, bad image tag, or app startup failures.

**Q15. What does Prometheus scrape?**
- **A:** Metrics endpoints exposed by applications/cluster components, based on its configuration.

**Q16. What does Grafana need to show dashboards?**
- **A:** A datasource (Prometheus) and dashboard definitions (JSON/provisioning).

**Q17. How do you safely rotate database credentials?**
- **A:** Update secret manager / Kubernetes Secret, restart workloads, ensure the DB user password is changed in PostgreSQL, and validate connectivity.

**Q18. How do you scale the backend?**
- **A:** Increase Deployment replicas or configure an HPA; ensure readiness probes and resource requests are correct.

**Q19. What’s the biggest difference between local Docker Compose and EKS?**
- **A:** EKS adds cluster scheduling, networking via Services/Ingress, persistent volumes, IAM/RBAC, and cloud load balancer integration.

**Q20. What is one high-impact security improvement for production?**
- **A:** Move secrets out of Git into AWS Secrets Manager/SSM and integrate via External Secrets/CSI; rotate all default credentials.
