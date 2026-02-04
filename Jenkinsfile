pipeline {
    agent any
    
    environment {
        // Docker Registry Configuration
        DOCKER_REGISTRY = 'saikiranasamwar4'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-frontend"
        
        // Credentials
        DOCKER_CREDENTIALS = credentials('dockerhub-credentials')
        KUBECONFIG = credentials('kubeconfig')
        SONAR_TOKEN = credentials('sonarqube-token')
        
        // SonarQube Configuration
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'taskmanager-project'
        
        // Kubernetes Configuration
        K8S_NAMESPACE = 'taskmanager'
        MONITORING_NAMESPACE = 'monitoring'
    }
    
    stages {
        // ============================================
        // STAGE 1: GIT - Source Code Management
        // ============================================
        stage('Git Checkout') {
            steps {
                echo '========================================='
                echo 'Stage 1: Checking out source code from Git'
                echo '========================================='
                checkout scm
                script {
                    // Display Git information
                    sh '''
                        echo "Git Branch: $(git rev-parse --abbrev-ref HEAD)"
                        echo "Git Commit: $(git rev-parse --short HEAD)"
                        echo "Git Author: $(git log -1 --pretty=format:'%an')"
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 2: SONARQUBE - Code Quality Analysis
        // ============================================
        stage('SonarQube Analysis') {
            steps {
                echo '========================================='
                echo 'Stage 2: Running SonarQube code analysis'
                echo '========================================='
                script {
                    // SonarQube Scanner for code quality and security analysis
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                            sonar-scanner \
                                -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                                -Dsonar.sources=. \
                                -Dsonar.host.url=${SONAR_HOST_URL} \
                                -Dsonar.login=${SONAR_TOKEN} \
                                -Dsonar.python.coverage.reportPaths=coverage.xml \
                                -Dsonar.exclusions=**/node_modules/**,**/*.test.js,**/venv/**
                        '''
                    }
                }
            }
        }
        
        // Quality Gate Check
        stage('SonarQube Quality Gate') {
            steps {
                echo 'Waiting for SonarQube Quality Gate result...'
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        
        // ============================================
        // STAGE 3: DOCKER - Build Images
        // ============================================
        stage('Docker Build - Backend') {
            steps {
                echo '========================================='
                echo 'Stage 3a: Building Backend Docker Image'
                echo '========================================='
                script {
                    dir('backend') {
                        sh '''
                            echo "Building backend image..."
                            docker build -t ${BACKEND_IMAGE}:v1.0 .
                            docker tag ${BACKEND_IMAGE}:v1.0 ${BACKEND_IMAGE}:${BUILD_NUMBER}
                            docker tag ${BACKEND_IMAGE}:v1.0 ${BACKEND_IMAGE}:latest
                            echo "Backend image built successfully!"
                        '''
                    }
                }
            }
        }
        
        stage('Docker Build - Frontend') {
            steps {
                echo '========================================='
                echo 'Stage 3b: Building Frontend Docker Image'
                echo '========================================='
                script {
                    dir('frontend') {
                        sh '''
                            echo "Building frontend image..."
                            docker build -t ${FRONTEND_IMAGE}:v1.0 .
                            docker tag ${FRONTEND_IMAGE}:v1.0 ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                            docker tag ${FRONTEND_IMAGE}:v1.0 ${FRONTEND_IMAGE}:latest
                            echo "Frontend image built successfully!"
                        '''
                    }
                }
            }
        }
        
        // ============================================
        // STAGE 4: DOCKER - Test Images
        // ============================================
        stage('Docker Test') {
            steps {
                echo '========================================='
                echo 'Stage 4: Testing Docker containers'
                echo '========================================='
                script {
                    sh '''
                        echo "Starting containers with docker compose..."
                        docker compose up -d
                        
                        echo "Waiting for services to be ready..."
                        sleep 30
                        
                        echo "Testing frontend accessibility..."
                        curl -f http://localhost:80 || exit 1
                        
                        echo "Testing backend health..."
                        curl -f http://localhost:8888 || exit 1
                        
                        echo "Stopping containers..."
                        docker compose down
                        
                        echo "Docker test completed successfully!"
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 5: DOCKER - Push Images to Registry
        // ============================================
        stage('Docker Push to Registry') {
            steps {
                echo '========================================='
                echo 'Stage 5: Pushing images to DockerHub'
                echo '========================================='
                script {
                    sh '''
                        echo "Logging into DockerHub..."
                        echo $DOCKER_CREDENTIALS_PSW | docker login -u $DOCKER_CREDENTIALS_USR --password-stdin
                        
                        echo "Pushing backend images..."
                        docker push ${BACKEND_IMAGE}:v1.0
                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest
                        
                        echo "Pushing frontend images..."
                        docker push ${FRONTEND_IMAGE}:v1.0
                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest
                        
                        echo "All images pushed successfully!"
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 6: KUBERNETES - Deploy Application
        // ============================================
        stage('K8s - Create Namespace') {
            steps {
                echo '========================================='
                echo 'Stage 6a: Creating Kubernetes namespace'
                echo '========================================='
                script {
                    sh '''
                        echo "Creating taskmanager namespace..."
                        kubectl apply -f k8s/namespace.yaml
                        
                        echo "Verifying namespace..."
                        kubectl get namespace ${K8S_NAMESPACE}
                    '''
                }
            }
        }
        
        stage('K8s - Apply Secrets') {
            steps {
                echo '========================================='
                echo 'Stage 6b: Applying Kubernetes secrets'
                echo '========================================='
                script {
                    sh '''
                        echo "Applying secrets for database and backend..."
                        kubectl apply -f k8s/secrets.yaml
                        
                        echo "Verifying secrets..."
                        kubectl get secrets -n ${K8S_NAMESPACE}
                    '''
                }
            }
        }
        
        stage('K8s - Deploy Database') {
            steps {
                echo '========================================='
                echo 'Stage 6c: Deploying PostgreSQL database'
                echo '========================================='
                script {
                    sh '''
                        echo "Creating PostgreSQL PersistentVolumeClaim..."
                        kubectl apply -f k8s/postgres-pvc.yaml
                        
                        echo "Deploying PostgreSQL..."
                        kubectl apply -f k8s/postgres-deployment.yaml
                        
                        echo "Waiting for PostgreSQL to be ready..."
                        kubectl wait --for=condition=ready pod -l app=postgres -n ${K8S_NAMESPACE} --timeout=300s
                        
                        echo "PostgreSQL deployed successfully!"
                        kubectl get pods -n ${K8S_NAMESPACE} -l app=postgres
                    '''
                }
            }
        }
        
        stage('K8s - Deploy Backend') {
            steps {
                echo '========================================='
                echo 'Stage 6d: Deploying Backend application'
                echo '========================================='
                script {
                    sh '''
                        echo "Deploying backend application..."
                        kubectl apply -f k8s/backend-deployment.yaml
                        
                        echo "Waiting for backend rollout to complete..."
                        kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=300s
                        
                        echo "Backend deployed successfully!"
                        kubectl get pods -n ${K8S_NAMESPACE} -l app=backend
                        kubectl get svc -n ${K8S_NAMESPACE} -l app=backend
                    '''
                }
            }
        }
        
        stage('K8s - Deploy Frontend') {
            steps {
                echo '========================================='
                echo 'Stage 6e: Deploying Frontend application'
                echo '========================================='
                script {
                    sh '''
                        echo "Deploying frontend application..."
                        kubectl apply -f k8s/frontend-deployment.yaml
                        
                        echo "Waiting for frontend rollout to complete..."
                        kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=300s
                        
                        echo "Frontend deployed successfully!"
                        kubectl get pods -n ${K8S_NAMESPACE} -l app=frontend
                        kubectl get svc -n ${K8S_NAMESPACE} -l app=frontend
                    '''
                }
            }
        }
        
        stage('K8s - Configure Ingress') {
            steps {
                echo '========================================='
                echo 'Stage 6f: Configuring Ingress/Load Balancer'
                echo '========================================='
                script {
                    sh '''
                        echo "Applying Ingress configuration..."
                        kubectl apply -f k8s/ingress.yaml
                        
                        echo "Waiting for Ingress to be ready..."
                        sleep 30
                        
                        echo "Ingress configured successfully!"
                        kubectl get ingress -n ${K8S_NAMESPACE}
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 7: KUBERNETES - Deploy Monitoring
        // ============================================
        stage('K8s - Deploy Monitoring Stack') {
            steps {
                echo '========================================='
                echo 'Stage 7: Deploying Monitoring (Prometheus & Grafana)'
                echo '========================================='
                script {
                    sh '''
                        echo "Creating monitoring namespace..."
                        kubectl create namespace ${MONITORING_NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
                        
                        echo "Deploying Prometheus RBAC..."
                        kubectl apply -f monitoring/prometheus-rbac.yaml
                        
                        echo "Deploying Prometheus ConfigMap..."
                        kubectl apply -f monitoring/prometheus-config.yaml
                        
                        echo "Deploying Prometheus server..."
                        kubectl apply -f monitoring/prometheus-deployment.yaml
                        
                        echo "Deploying Grafana datasource..."
                        kubectl apply -f monitoring/grafana-datasource.yaml
                        
                        echo "Deploying Grafana dashboard config..."
                        kubectl apply -f monitoring/grafana-dashboard-config.yaml
                        
                        echo "Deploying Grafana server..."
                        kubectl apply -f monitoring/grafana-deployment.yaml
                        
                        echo "Monitoring stack deployed successfully!"
                        kubectl get pods -n ${MONITORING_NAMESPACE}
                        kubectl get svc -n ${MONITORING_NAMESPACE}
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 8: VERIFICATION
        // ============================================
        stage('Verify Deployment') {
            steps {
                echo '========================================='
                echo 'Stage 8: Verifying complete deployment'
                echo '========================================='
                script {
                    sh '''
                        echo "=== Application Namespace Status ==="
                        kubectl get all -n ${K8S_NAMESPACE}
                        
                        echo ""
                        echo "=== Monitoring Namespace Status ==="
                        kubectl get all -n ${MONITORING_NAMESPACE}
                        
                        echo ""
                        echo "=== Deployment Health Check ==="
                        kubectl get deployments -n ${K8S_NAMESPACE}
                        kubectl get deployments -n ${MONITORING_NAMESPACE}
                        
                        echo ""
                        echo "=== Ingress Status ==="
                        kubectl describe ingress -n ${K8S_NAMESPACE}
                    '''
                }
            }
        }
    }
    
    // ============================================
    // POST-BUILD ACTIONS
    // ============================================
    post {
        always {
            echo 'Cleaning up workspace and logging out...'
            sh 'docker logout || true'
            cleanWs()
        }
        success {
            echo '✅ ========================================='
            echo '✅ PIPELINE COMPLETED SUCCESSFULLY!'
            echo '✅ ========================================='
            echo 'Application deployed to Kubernetes cluster'
            echo 'Monitoring stack is ready'
        }
        failure {
            echo '❌ ========================================='
            echo '❌ PIPELINE FAILED!'
            echo '❌ ========================================='
            echo 'Check logs above for error details'
        }
    }
}
