pipeline {
    agent any
    
    environment {
        DOCKER_REGISTRY = 'saikiranasamwar4'
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-backend"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/taskmanager-frontend"
        SONAR_HOST_URL = 'http://localhost:9000'
        SONAR_PROJECT_KEY = 'taskmanager-project'
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
                        sh """
                            sonar-scanner \
                            -Dsonar.projectKey=${SONAR_PROJECT_KEY} \
                            -Dsonar.sources=. \
                            -Dsonar.host.url=${SONAR_HOST_URL} \
                            -Dsonar.login=$SONAR_TOKEN \
                            -Dsonar.exclusions=**/node_modules/**,**/*.test.js,**/venv/**
                        """
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
                        docker build -t ${BACKEND_IMAGE}:v1.0 .
                        docker tag ${BACKEND_IMAGE}:v1.0 ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${BACKEND_IMAGE}:v1.0 ${BACKEND_IMAGE}:latest
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
                        docker build -t ${FRONTEND_IMAGE}:v1.0 .
                        docker tag ${FRONTEND_IMAGE}:v1.0 ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker tag ${FRONTEND_IMAGE}:v1.0 ${FRONTEND_IMAGE}:latest
                    '''
                }
            }
        }
        
        // ============================================
        // STAGE 5: DOCKER TEST
        // ============================================
        stage('Docker Test') {
            steps {
                sh '''
                    docker compose up -d
                    sleep 30
                    curl -f http://localhost:80 || exit 1
                    curl -f http://localhost:8888 || exit 1
                    docker compose down
                '''
            }
        }
        
        // ============================================
        // STAGE 6: DOCKER PUSH
        // ============================================
        stage('Docker Push to DockerHub') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', passwordVariable: 'DOCKER_PASS', usernameVariable: 'DOCKER_USER')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        
                        docker push ${BACKEND_IMAGE}:v1.0
                        docker push ${BACKEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${BACKEND_IMAGE}:latest
                        
                        docker push ${FRONTEND_IMAGE}:v1.0
                        docker push ${FRONTEND_IMAGE}:${BUILD_NUMBER}
                        docker push ${FRONTEND_IMAGE}:latest
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
            echo 'CI Pipeline Completed Successfully!'
        }
        failure {
            echo 'Pipeline Failed! Check logs.'
        }
    }
}
