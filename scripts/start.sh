#!/usr/bin/env bash
set -e

echo "🚀 Starting Mini Delivery Tracker..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in Nix environment
if [ -z "$IN_NIX_SHELL" ]; then
  print_error "Please run 'nix develop' first to enter the development environment"
  exit 1
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
  print_error "Docker is not running. Please start Docker first."
  exit 1
fi

# Start Minikube if not running
print_status "Checking Minikube status..."
if ! minikube status | grep -q "Running"; then
  print_status "Starting Minikube..."
  minikube start --driver=docker --memory=4096 --cpus=2
  print_success "Minikube started"
else
  print_success "Minikube is already running"
fi

# Configure Docker to use Minikube's Docker daemon
print_status "Configuring Docker environment..."
eval $(minikube docker-env)

# Build Docker images
print_status "Building Docker images..."
echo "Building backend image..."
cd backend
./mvnw clean package -DskipTests
docker build -t delivery-tracker/backend:latest .
cd ..

echo "Building frontend image..."
cd frontend
npm ci
npm run build:prod
docker build -t delivery-tracker/frontend:latest .
cd ..

print_success "Docker images built successfully"

# Deploy to Kubernetes
print_status "Deploying to Kubernetes..."
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/postgres.yaml
kubectl apply -f infra/k8s/kafka.yaml

# Wait for dependencies
print_status "Waiting for database and Kafka to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n delivery-tracker --timeout=300s
kubectl wait --for=condition=ready pod -l app=kafka -n delivery-tracker --timeout=300s

# Deploy application services
kubectl apply -f infra/k8s/backend.yaml
kubectl apply -f infra/k8s/frontend.yaml

# Wait for application pods
print_status "Waiting for application services to be ready..."
kubectl wait --for=condition=ready pod -l app=backend -n delivery-tracker --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n delivery-tracker --timeout=300s

print_success "All services deployed successfully"

# Set up port forwarding
print_status "Setting up port forwarding..."
kubectl port-forward service/frontend-service 4200:80 -n delivery-tracker &
FRONTEND_PID=$!
kubectl port-forward service/backend-service 8080:8080 -n delivery-tracker &
BACKEND_PID=$!

# Setup Cloudflare tunnel if credentials are available
if [ -n "$CLOUDFLARE_TOKEN" ] && [ -n "$TUNNEL_DOMAIN" ]; then
  print_status "Setting up Cloudflare tunnel..."
  ./scripts/setup-tunnel.sh &
  TUNNEL_PID=$!
else
  print_warning "Cloudflare tunnel not configured. Set CLOUDFLARE_TOKEN and TUNNEL_DOMAIN environment variables to enable."
fi

# Function to cleanup on exit
cleanup() {
  print_status "Cleaning up..."
  kill $FRONTEND_PID $BACKEND_PID 2>/dev/null || true
  if [ -n "$TUNNEL_PID" ]; then
    kill $TUNNEL_PID 2>/dev/null || true
  fi
  print_success "Cleanup completed"
}

# Set trap for cleanup
trap cleanup EXIT

print_success "🎉 Mini Delivery Tracker is running!"
echo ""
echo "📱 Frontend: http://localhost:4200"
echo "🔧 Backend API: http://localhost:8080"
echo "📚 Swagger UI: http://localhost:8080/swagger-ui.html"
echo ""
echo "🔑 Default credentials:"
echo "   Admin: admin / admin123"
echo "   User: user / user123"
echo ""
echo "💡 Useful commands:"
echo "   kubectl get pods -n delivery-tracker    # Check pod status"
echo "   kubectl logs -f deployment/backend -n delivery-tracker    # View backend logs"
echo "   kubectl logs -f deployment/frontend -n delivery-tracker   # View frontend logs"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep the script running
wait
