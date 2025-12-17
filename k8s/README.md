# Kubernetes Deployment for AWS EKS

This directory contains Kubernetes manifests for deploying the Task Manager application to AWS EKS.

## Prerequisites

- AWS CLI configured with appropriate credentials
- kubectl installed
- eksctl installed (optional, for cluster creation)
- AWS EKS cluster created

## Create EKS Cluster

```bash
# Create EKS cluster (takes 15-20 minutes)
eksctl create cluster \
  --name task-manager-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 1 \
  --nodes-max 3 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --name task-manager-cluster --region us-east-1
```

## Deploy Application

### 1. Apply all manifests in order

```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets and configmap
kubectl apply -f k8s/secrets.yaml

# Create persistent volume claim
kubectl apply -f k8s/postgres-pvc.yaml

# Deploy PostgreSQL
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l app=postgres -n task-manager --timeout=300s

# Deploy backend
kubectl apply -f k8s/backend-deployment.yaml

# Deploy frontend
kubectl apply -f k8s/frontend-deployment.yaml

# Optional: Create ingress (requires AWS Load Balancer Controller)
kubectl apply -f k8s/ingress.yaml
```

### 2. Or apply all at once

```bash
kubectl apply -f k8s/
```

## Verify Deployment

```bash
# Check all resources
kubectl get all -n task-manager

# Check pods status
kubectl get pods -n task-manager

# Check services
kubectl get svc -n task-manager

# Get frontend LoadBalancer URL
kubectl get svc frontend-service -n task-manager -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

## Access Application

```bash
# Get LoadBalancer URL
export FRONTEND_URL=$(kubectl get svc frontend-service -n task-manager -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
echo "Frontend: http://$FRONTEND_URL"

# If using Ingress
kubectl get ingress -n task-manager
```

## Scale Deployment

```bash
# Scale backend
kubectl scale deployment backend -n task-manager --replicas=3

# Scale frontend
kubectl scale deployment frontend -n task-manager --replicas=3
```

## View Logs

```bash
# View backend logs
kubectl logs -f deployment/backend -n task-manager

# View frontend logs
kubectl logs -f deployment/frontend -n task-manager

# View database logs
kubectl logs -f deployment/postgres -n task-manager
```

## Update Application

```bash
# Update backend image
kubectl set image deployment/backend backend=saikiranasamwar4/task-manager-backend:v2 -n task-manager

# Update frontend image
kubectl set image deployment/frontend frontend=saikiranasamwar4/task-manager-frontend:v2 -n task-manager

# Check rollout status
kubectl rollout status deployment/backend -n task-manager
kubectl rollout status deployment/frontend -n task-manager
```

## Troubleshooting

```bash
# Describe pod
kubectl describe pod <pod-name> -n task-manager

# Get pod logs
kubectl logs <pod-name> -n task-manager

# Execute command in pod
kubectl exec -it <pod-name> -n task-manager -- /bin/sh

# Check events
kubectl get events -n task-manager --sort-by='.lastTimestamp'
```

## Clean Up

```bash
# Delete all resources
kubectl delete namespace task-manager

# Or delete individual resources
kubectl delete -f k8s/

# Delete EKS cluster
eksctl delete cluster --name task-manager-cluster --region us-east-1
```

## Install AWS Load Balancer Controller (Optional)

Required if using Ingress:

```bash
# Create IAM policy
curl -o iam-policy.json https://raw.githubusercontent.com/kubernetes-sigs/aws-load-balancer-controller/main/docs/install/iam_policy.json
aws iam create-policy --policy-name AWSLoadBalancerControllerIAMPolicy --policy-document file://iam-policy.json

# Install controller with Helm
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=task-manager-cluster \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

## Cost Optimization

- Use t3.small or t3.medium nodes for development
- Enable cluster autoscaler for production
- Use Spot instances for non-production workloads
- Delete resources when not in use

## Production Considerations

- Use AWS Secrets Manager instead of Kubernetes Secrets
- Enable network policies for pod security
- Use RDS instead of containerized PostgreSQL
- Configure HPA (Horizontal Pod Autoscaler)
- Set up monitoring with CloudWatch Container Insights
- Enable logging with FluentBit/CloudWatch
- Use cert-manager for SSL/TLS certificates
