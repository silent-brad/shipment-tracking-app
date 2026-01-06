# Mini Shipment Tracker

A complete full-stack delivery tracking application built with Spring Boot (Java), Angular (TypeScript), PostgreSQL, and Kafka, containerized with Docker and deployable on Kubernetes via NixOS.

## Features

- **Backend**: Spring Boot REST API with JWT authentication, Kafka event streaming
- **Frontend**: Angular SPA with real-time updates and Fizzy-inspired minimal design
- **Database**: PostgreSQL with JPA/Hibernate
- **Messaging**: Kafka for event-driven status updates
- **Security**: JWT-based authentication with Spring Security
- **Containerization**: Docker containers for all services
- **Orchestration**: Kubernetes manifests for local deployment via Minikube
- **Tunneling**: Cloudflare Tunnel for secure external access
- **Testing**: Unit and integration tests included
- **Documentation**: Swagger API documentation

## Prerequisites

- NixOS system with flakes enabled
- Cloudflare account (for tunneling - optional)
- Git

## Quick Start

1. **Clone and enter development environment**:
   ```bash
   git clone <this-repo>
   cd delivery-tracking-app
   nix develop
   ```

2. **Start all services**:
   ```bash
   ./start.sh
   ```

3. **Access the application**:
   - Local: http://localhost:4200
   - Swagger API: http://localhost:8080/swagger-ui.html
   - Tunnel URL will be displayed in console

## Default Credentials

- Username: `admin`
- Password: `admin123`

## Development Commands

```bash
# Enter development shell
nix develop

# Build all images
nix build .#dockerImages

# Start services individually
./scripts/start-minikube.sh
./scripts/deploy-k8s.sh
./scripts/setup-tunnel.sh

# Run tests
cd backend && ./mvnw test
cd frontend && npm test
```

## Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│   Angular UI    │◄──►│ Spring Boot  │◄──►│   PostgreSQL    │
│   (Port 4200)   │    │  (Port 8080) │    │   (Port 5432)   │
└─────────────────┘    └──────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │    Kafka     │
                       │  (Port 9092) │
                       └──────────────┘
```

## Environment Configuration

Create `.env` file in the root directory:
```bash
cp backend/.env.example .env
```

For Cloudflare Tunnel, also set:
```bash
export CLOUDFLARE_TOKEN=your_cloudflare_token
export TUNNEL_DOMAIN=your-domain.com
```

## Project Structure

- `backend/` - Spring Boot application
- `frontend/` - Angular application  
- `infra/` - Kubernetes manifests and Docker configurations
- `scripts/` - Automation scripts
- `flake.nix` - Nix development environment
