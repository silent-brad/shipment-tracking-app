# Mini Shipment Tracker

## Prerequisites

- Nix with flakes enabled

## Quick Start

1. **Clone and enter development environment**:

   ```bash
   git clone <this-repo>
   cd delivery-tracking-app
   nix build
   ```

2. **Start all services**:

   ```bash
   ./result/bin/start.sh
   ```

3. **Access the application**:
   - Local: <http://localhost:4200>
   - Swagger API: <http://localhost:8080/swagger-ui.html>
   - Tunnel URL will be displayed in console

## Default Credentials

- Username: `admin`
- Password: `admin123`

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

Create `.env` file in the root and backend directory:

```bash
cp .env.example .env
cp backend/.env.example .env
```

<!--For Cloudflare Tunnel, also set:

```bash
export CLOUDFLARE_TOKEN=your_cloudflare_token
export TUNNEL_DOMAIN=your-domain.com
```
-->

## Project Structure

- `backend/` - Spring Boot application
- `frontend/` - Angular application
- `infra/` - Kubernetes manifests and Docker configurations
- `flake.nix` - Nix development environment
