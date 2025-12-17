// =============================================================================
// Jenkins Declarative Pipeline for Task Manager Application
// =============================================================================
// This pipeline automates the complete CI/CD workflow:
// 1. Checkout code from Git
// 2. Build Docker images for backend and frontend
// 3. Push images to Docker Hub registry
// 4. Deploy application to Kubernetes/EKS cluster
// =============================================================================

pipeline {
    // Run this pipeline on any available Jenkins agent/node
    agent any
    
    // Environment variables accessible throughout all pipeline stages
    environment {
        // Load Docker Hub credentials from Jenkins credentials store
        // Credential ID must be configured in Jenkins: Manage Jenkins → Credentials
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        
        // Docker Hub repository/organization name
        DOCKER_HUB_REPO = 'saikiranasamwar4'
        
        // Complete Docker image name for application (backend + frontend)
        // Format: repository/image-name
        APP_IMAGE = "${DOCKER_HUB_REPO}/task-manager"
        
        // Docker image tag using Jenkins build number for versioning
        // Each build gets a unique tag (1, 2, 3, etc.)
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // Kubernetes configuration file for EKS cluster authentication
        // Must be uploaded as a secret file credential in Jenkins
        KUBECONFIG = credentials('kubeconfig-eks')
        
        // Kubernetes namespace where the application will be deployed
        K8S_NAMESPACE = 'task-manager'
    }
    
    // Pipeline stages execute sequentially in the order defined
    stages {
        
        // =================================================================
        // STAGE 1: CHECKOUT
        // =================================================================
        // Purpose: Clone the source code repository to Jenkins workspace
        // =================================================================
        stage('Checkout') {
            steps {
                // Display message in Jenkins console output
                echo 'Checking out code...'
                
                // Checkout code from Source Control Management (Git)
                // Uses the repository configured in Jenkins job settings
                // Pulls the latest code from the specified branch
                checkout scm
            }
        }
        
        // =================================================================
        // STAGE 2: BUILD APPLICATION DOCKER IMAGE
        // =================================================================
        // Purpose: Create Docker container image for the application
        // =================================================================
        stage('Build Application Image') {
            steps {
                // Display status message
                echo 'Building application image...'
                
                // Build Docker image using shell command
                // docker build: Docker command to build images
                // -t ${APP_IMAGE}:${IMAGE_TAG}: Tag image with build number
                // -t ${APP_IMAGE}:latest: Also tag as 'latest' for easy reference
                // -f backend/Dockerfile: Specify Dockerfile location
                // . : Build context is project root (to access both backend and frontend)
                sh "docker build -t ${APP_IMAGE}:${IMAGE_TAG} -t ${APP_IMAGE}:latest -f backend/Dockerfile ."
            }
        }
        
        // =================================================================
        // STAGE 4: PUSH IMAGES TO DOCKER HUB
        // =================================================================
        // Purpose: Upload built images to Docker Hub registry
        // =================================================================
        stage('Push to Docker Hub') {
            steps {
                // Display status message
                echo 'Pushing images to Docker Hub...'
                
                // Authenticate with Docker registry using stored credentials
                // withDockerRegistry: Jenkins plugin function for Docker authentication
                // credentialsId: Jenkins credential ID for Docker Hub
                // url: Docker Hub registry URL
                withDockerRegistry([credentialsId: 'dockerhub-credentials', url: 'https://index.docker.io/v1/']) {
                    
                    // Execute multi-line shell script
                    // Triple quotes allow multi-line strings
                    sh """
                        // Push backend image with build number tag
                        // This creates a versioned image for rollback capability
                        docker push ${BACKEND_IMAGE}:${IMAGE_TAG}
                        
                        // Push backend image with 'latest' tag
                        // 'latest' always points to most recent build
                        docker push ${BACKEND_IMAGE}:latest
                        
                        // Push frontend image with build number tag
                        // Enables version tracking and rollback
                        docker push ${FRONTEND_IMAGE}:${IMAGE_TAG}
                        
                        // Push frontend image with 'latest' tag
                        // Points to the most recent frontend build
                        docker push ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }
        
        // =====================application image with build number tag
                        // This creates a versioned image for rollback capability
                        docker push ${APP_IMAGE}:${IMAGE_TAG}
                        
                        // Push application image with 'latest' tag
                        // 'latest' always points to most recent build
                        docker push ${APP which cluster to connect to
                    export KUBECONFIG=${KUBECONFIG}
                    
                    # Apply namespace manifest
                    # Creates 'task-manager' namespace if it doesn't exist
                    # Namespaces provide logical separation of resources
                    kubectl apply -f k8s/namespace.yaml
                    
                    # Apply secrets manifest
                    # Creates database credentials and application config
                    # Secrets store sensitive data like passwords
                    kubectl apply -f k8s/secrets.yaml
                    
                    # Apply persistent volume claim
                    # Requests 10GB of storage for PostgreSQL database
                    # PVC ensures data persists across pod restarts
                    kubectl apply -f k8s/postgres-pvc.yaml
                    
                    # Deploy PostgreSQL database
                    # Creates database pod with persistent storage attached
                    # Database must be ready before deploying backend
                    kubectl apply -f k8s/postgres-deployment.yaml
                    
                    # Wait for PostgreSQL pod to become ready
                    # --for=condition=ready: Wait until pod is healthy
                    # -l app=postgres: Select pods with this label
                    # -n ${K8S_NAMESPACE}: In specified namespace
                    # --timeout=300s: Wait max 5 minutes
                    # || true: Continue even if timeout (won't fail pipeline)
                    kubectl wait --for=condition=ready pod -l app=postgres -n ${K8S_NAMESPACE} --timeout=300s || true
                    
                    # Apply backend deployment manifest
                    # Creates backend pods and ClusterIP service
                    # Service enables communication between pods
                    kubectl apply -f k8s/backend-deployment.yaml
                    
                    # Update backend deployment with new image
                    # kubectl set image: Changes container image
                    # deployment/backend: Target deployment name
                    # backend=...: Container name and new image
                    # Triggers rolling update to new version
                    kubectl set image deployment/backend backend=${BACKEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}
                    
                    # Apply frontend deployment manifest
                    # Creates frontend pods and LoadBalancer service
                    # LoadBalancer exposes app to internet via AWS ELB
                    kubectl apply -f k8s/frontend-deployment.yaml
                    
                    # Update frontend deployment with new image
                    # Triggers rolling update of frontend pods
                    # Old pods removed gradually as new ones become ready
                    kubectl set image deployment/frontend frontend=${FRONTEND_IMAGE}:${IMAGE_TAG} -n ${K8S_NAMESPACE}
                    
                    # Apply ingress manifest (optional)
                    # Creates AWS Application Load Balancer
                    # Routes traffic based on URL paths
                    # || true: Don't fail if ingress not needed
                    kubectl apply -f k8s/ingress.yaml || true
                    
                    # Wait for backend rollout to complete
                    # Ensures all backend pods updated successfully
                    # rollout status: Monitors deployment progress
                    # --timeout=300s: Wait max 5 minutes
                    kubectl rollout status deployment/backend -n ${K8S_NAMESPACE} --timeout=300s
                    
                    # Wait for frontend rollout to complete
                    # Confirms all frontend pods running new version
                    # Pipeline only proceeds when deployment succeeds
                    kubectl rollout status deployment/frontend -n ${K8S_NAMESPACE} --timeout=300s
                    
                    # Display all pods in namespace
                    # Shows pod names, status, restarts, and age
                    # Useful for verifying deployment success
                    kubectl get pods -n ${K8S_NAMESPACE}
                    
                    # Display all services in namespace
                    # Shows service names, types, and external IPs
                    # LoadBalancer URL visible here after provisioning
                    kubectl get svc -n ${K8S_NAMESPACE}
                '''
            }
        }
    }
    
    // =================================================================
    // POST-BUILD ACTIONS
    // =================================================================
    // These steps run after all stages complete (success or failure)
    // =================================================================
    post {
        
        // Actions executed only if pipeline succeeds
        success {
            // Display success message
            echo 'Pipeline completed successfully!'
            
            // Execute shell commands to show deployment details
            sh '''
                # Set kubeconfig environment variable
                export KUBECONFIG=${KUBECONFIG}
                
                # Display all Kubernetes resources in namespace
                # Shows: pods, services, deployments, replicasets
                # Provides complete view of deployed application
                kubectl get all -n ${K8S_NAMESPACE}
                
                # Print header for LoadBalancer URL
                echo "Frontend LoadBalancer URL:"
                
                # Extract LoadBalancer hostname from frontend service
                # -o jsonpath: Output specific JSON field
                # '{.status.loadBalancer...}': JSONPath to hostname
                # This is the public URL to access application
                # || echo...: Show message if URL not yet available
                kubectl get svc frontend-service -n ${K8S_NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' || echo "Not available yet"
            '''
        }
        
        // Actions executed only if pipeline fails
        failure {
            // Display failure message
            echo 'Pipeline failed!'
            
            // Execute troubleshooting commands
            sh '''
                # Set kubeconfig for cluster access
                export KUBECONFIG=${KUBECONFIG}
                
                # Display pod status to identify failed pods
                # Shows: pod name, ready count, status, restarts
                # || true: Don't fail if namespace doesn't exist
                kubectl get pods -n ${K8S_NAMESPACE} || true
                
                # Show detailed pod information
                # describe: Shows events, errors, and configurations
                # Helps identify why pods failed to start
                # Includes: image pull errors, crash logs, etc.
                kubectl describe pods -n ${K8S_NAMESPACE} || true
            '''
        }
        
        // Actions always executed (success or failure)
        always {
            // Display cleanup message
            echo 'Cleaning up...'
            
            // Remove unused Docker images from Jenkins agent
            // docker image prune: Deletes dangling images
            // -f: Force removal without confirmation
            // Frees disk space on Jenkins server
            // || true: Don't fail pipeline if no images to prune
            sh 'docker image prune -f || true'
        }
    }