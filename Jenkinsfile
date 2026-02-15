pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'saikiranasamwar4'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-frontend"
    }
    
    stages {
        
        // ============================================
        // STAGE 1: GIT CHECKOUT
        // ============================================
        stage('Git Checkout') {
            steps {
                echo 'Checking out source code from Git...'
                checkout scm
            }
        }

        // ============================================
        // STAGE 2: SONARQUBE ANALYSIS
        // ============================================
        stage('SonarQube Analysis') {
            steps {
                withCredentials([string(credentialsId: 'sonarqube-token', variable: 'SONAR_TOKEN')]) {
                    withSonarQubeEnv('SonarQube') {
                        sh '''
                        /usr/bin/sonar-scanner \
                        -Dsonar.projectKey=taskmanager-project \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=http://localhost:9000 \
                        -Dsonar.login=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        // ============================================
        // STAGE 3: DOCKER BUILD BACKEND
        // ============================================
        stage('Docker Build - Backend') {
            steps {
                dir('backend') {
                    sh '''
                        docker build -t saikiranasamwar4/taskmanager-backend:v1.0 .
                        docker tag saikiranasamwar4/taskmanager-backend:v1.0 saikiranasamwar4/taskmanager-backend:${BUILD_NUMBER}
                        docker tag saikiranasamwar4/taskmanager-backend:v1.0 saikiranasamwar4/taskmanager-backend:latest
                    '''
                }
            }
        }

        // ============================================
        // STAGE 4: DOCKER BUILD FRONTEND
        // ============================================
        stage('Docker Build - Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        docker build -t saikiranasamwar4/taskmanager-frontend:v1.0 .
                        docker tag saikiranasamwar4/taskmanager-frontend:v1.0 saikiranasamwar4/taskmanager-frontend:${BUILD_NUMBER}
                        docker tag saikiranasamwar4/taskmanager-frontend:v1.0 saikiranasamwar4/taskmanager-frontend:latest
                    '''
                }
            }
        }

        // ============================================
        // STAGE 5: FREE PORT 5432 (FIX)
        // ============================================
        stage('Free Port 5432') {
            steps {
                sh '''
                echo "Stopping Host PostgreSQL if running..."
                sudo systemctl stop postgresql || true
                sudo systemctl disable postgresql || true

                echo "Killing process using port 5432..."
                sudo fuser -k 5432/tcp || true

                echo "Cleaning previous docker containers..."
                docker compose down || true
                docker rm -f taskmanager-pipeline-postgres-1 || true
                docker network prune -f || true
                '''
            }
        }

        // ============================================
        // STAGE 6: DOCKER TEST
        // ============================================
        stage('Docker Test') {
            steps {
                sh '''
                    docker compose up -d
                    echo "Waiting for containers to start..."
                    sleep 40

                    echo "Testing Backend..."
                    curl -f http://localhost:8888 || exit 1

                    echo "Testing Frontend..."
                    curl -f http://localhost:80 || exit 1

                    docker compose down
                '''
            }
        }

        // ============================================
        // STAGE 7: DOCKER PUSH
        // ============================================
        stage('Docker Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        
                        docker push saikiranasamwar4/taskmanager-backend:v1.0
                        docker push saikiranasamwar4/taskmanager-backend:${BUILD_NUMBER}
                        docker push saikiranasamwar4/taskmanager-backend:latest
                        
                        docker push saikiranasamwar4/taskmanager-frontend:v1.0
                        docker push saikiranasamwar4/taskmanager-frontend:${BUILD_NUMBER}
                        docker push saikiranasamwar4/taskmanager-frontend:latest
                    '''
                }
            }
        }

        // ============================================
        // STAGE 8: DEPLOY TO EKS
        // ============================================
        stage('Deploy to EKS') {
            steps {
                withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'aws-credentials']]) {
                    sh '''
                        # Configure kubectl
                        aws eks update-kubeconfig --name taskmanager-eks --region us-east-1

                        # Setup namespace
                        kubectl apply -f k8s/namespace.yaml

                        # Clean stuck pods
                        kubectl delete pods --field-selector=status.phase=Failed -n taskmanager 2>/dev/null || true
                        kubectl delete pods --field-selector=status.phase=Unknown -n taskmanager 2>/dev/null || true

                        # Update image tags to current build
                        sed -i "s|saikiranasamwar4/taskmanager-backend:v1.0|saikiranasamwar4/taskmanager-backend:${BUILD_NUMBER}|g" k8s/backend-deployment.yaml
                        sed -i "s|saikiranasamwar4/taskmanager-frontend:v1.0|saikiranasamwar4/taskmanager-frontend:${BUILD_NUMBER}|g" k8s/frontend-deployment.yaml

                        # Install EBS CSI Driver if missing (needed for PVC)
                        aws eks create-addon --cluster-name taskmanager-eks --addon-name aws-ebs-csi-driver --region us-east-1 2>/dev/null || true

                        # Deploy everything
                        kubectl apply -f k8s/secrets.yaml
                        kubectl apply -f k8s/postgres-pvc.yaml
                        kubectl apply -f k8s/postgres-deployment.yaml

                        # Wait for PostgreSQL
                        echo "Waiting for PostgreSQL..."
                        kubectl rollout status deployment/postgres -n taskmanager --timeout=300s

                        # Deploy app
                        kubectl apply -f k8s/backend-deployment.yaml
                        kubectl apply -f k8s/frontend-deployment.yaml
                        kubectl apply -f k8s/ingress.yaml

                        # Wait for app rollouts
                        echo "Waiting for Backend..."
                        kubectl rollout status deployment/backend -n taskmanager --timeout=300s || {
                            echo "=== Backend Debug ==="
                            kubectl get pods -n taskmanager -l app=backend -o wide
                            kubectl describe pods -n taskmanager -l app=backend | tail -40
                            kubectl logs -n taskmanager -l app=backend --tail=20 || true
                            exit 1
                        }

                        echo "Waiting for Frontend..."
                        kubectl rollout status deployment/frontend -n taskmanager --timeout=300s || {
                            echo "=== Frontend Debug ==="
                            kubectl get pods -n taskmanager -l app=frontend -o wide
                            kubectl describe pods -n taskmanager -l app=frontend | tail -40
                            exit 1
                        }

                        echo "Deployment Successful!"
                        kubectl get pods -n taskmanager -o wide
                        kubectl get svc -n taskmanager

                        # Deploy Monitoring Stack
                        echo "Deploying Monitoring..."
                        kubectl create namespace monitoring || true
                        kubectl apply -f monitoring/prometheus-rbac.yaml
                        kubectl apply -f monitoring/prometheus-config.yaml
                        kubectl apply -f monitoring/prometheus-deployment.yaml
                        kubectl apply -f monitoring/node-exporter.yaml
                        kubectl apply -f monitoring/kube-state-metrics.yaml
                        kubectl apply -f monitoring/grafana-datasource.yaml
                        kubectl apply -f monitoring/grafana-dashboard-config.yaml
                        kubectl apply -f monitoring/grafana-deployment.yaml

                        echo "Waiting for Prometheus..."
                        kubectl rollout status deployment/prometheus -n monitoring --timeout=120s || true

                        echo "Waiting for Kube State Metrics..."
                        kubectl rollout status deployment/kube-state-metrics -n monitoring --timeout=120s || true

                        echo "Waiting for Node Exporter..."
                        kubectl rollout status daemonset/node-exporter -n monitoring --timeout=120s || true

                        echo "Waiting for Grafana..."
                        kubectl rollout status deployment/grafana -n monitoring --timeout=120s || true

                        echo "=== Monitoring Status ==="
                        kubectl get pods -n monitoring -o wide
                        kubectl get svc -n monitoring
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }
        success {
            echo 'CI/CD Pipeline Completed Successfully!'
        }
        failure {
            echo 'Pipeline Failed! Check logs.'
        }
    }
}
