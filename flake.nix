{
  description =
    "Mini Delivery Tracker - Full-stack application with Spring Boot, Angular, and Kubernetes";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    frontend = {
      url = "./frontend";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    backend = {
      url = "./backend";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, frontend, backend }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        jdk = pkgs.openjdk21;
        node = pkgs.nodejs_20;

        # Custom cloudflared package
        cloudflared = pkgs.cloudflared;

        # Development tools
        devTools = with pkgs; [
          # Java ecosystem
          jdk
          maven

          # Node.js ecosystem
          node
          nodePackages.npm
          nodePackages."@angular/cli"

          # Container and orchestration
          docker
          docker-compose
          kubernetes
          minikube
          kubectl
          kubernetes-helm

          # Database
          mongodb

          # Messaging
          kafkactl

          # Cloud tools
          cloudflared

          # Development utilities
          git
          curl
          jq
          yq

          # Testing and linting
          nodePackages.eslint
          nodePackages.prettier
        ];

        # Scripts for easy management
        startScript = pkgs.writeShellScriptBin "start" ''
          set -e
          echo "🚀 Starting Mini Delivery Tracker..."

          # Add Docker images to local registry
          docker load < ${frontend.packages.${system}.dockerImage}
          docker load < ${backend.packages.${system}.dockerImage}

          # Start Minikube if not running
          if ! ${pkgs.minikube}/bin/minikube status | grep -q "Running"; then
            echo "Starting Minikube..."
            #$\{pkgs.minikube}/bin/minikube start --driver=docker --cpus=6 --memory=8190
            ${pkgs.minikube}/bin/minikube start --driver=docker --cpus=2 --memory=4096
          fi

          # Configure Docker to use Minikube's Docker daemon
          echo "Configuring Docker environment..."
          eval $(${pkgs.minikube}/bin/minikube docker-env --shell=bash)

          # Load environment variables and process templates
          echo "Loading environment variables from infra/k8s/.env..."
          if [ -f "infra/k8s/.env" ]; then
            # Read and convert all variables to base64 with _B64 suffix
            while IFS= read -r line; do
              if [[ ! "$line" =~ ^#.* ]] && [[ "$line" == *=* ]]; then
                var_name=$(echo "$line" | cut -d'=' -f1)
                var_value=$(echo "$line" | cut -d'=' -f2-)
                # Export original variable
                export "$var_name=$var_value"
                # Export base64 encoded version with _B64 suffix
                encoded_value=$(echo -n "$var_value" | ${pkgs.coreutils}/bin/base64 -w 0)
                export "''${var_name}_B64=$encoded_value"
              fi
            done < infra/k8s/.env
          fi

          # Process template files with environment variable substitution
          echo "Processing Kubernetes manifests with environment variables..."
          mkdir -p /tmp/k8s-processed
          for file in infra/k8s/*.yaml; do
            if [ -f "$file" ] && [ "$(basename "$file")" != "namespace.yaml" ]; then
              ${pkgs.envsubst}/bin/envsubst < "$file" > "/tmp/k8s-processed/$(basename "$file")"
            else
              cp "$file" "/tmp/k8s-processed/$(basename "$file")"
            fi
          done

          # Deploy to Kubernetes
          echo "Deploying to Kubernetes..."
          # Apply namespace first and wait for it to be ready
          ${pkgs.kubectl}/bin/kubectl apply -f infra/k8s/namespace.yaml
          # Check if namespace exists and is active, skip waiting if already active
          if ! ${pkgs.kubectl}/bin/kubectl get namespace delivery-tracker -o jsonpath='{.status.phase}' 2>/dev/null | grep -q "Active"; then
            echo "Waiting for namespace to become active..."
            ${pkgs.kubectl}/bin/kubectl wait --for=condition=Active namespace/delivery-tracker --timeout=30s
          else
            echo "Namespace delivery-tracker is already active"
          fi
          # Apply remaining resources
          ${pkgs.kubectl}/bin/kubectl apply -f /tmp/k8s-processed/mongodb.yaml
          ${pkgs.kubectl}/bin/kubectl apply -f /tmp/k8s-processed/kafka.yaml
          ${pkgs.kubectl}/bin/kubectl apply -f /tmp/k8s-processed/backend.yaml
          ${pkgs.kubectl}/bin/kubectl apply -f /tmp/k8s-processed/frontend.yaml

          # Wait for services to be ready
          echo "Waiting for services to be ready..."
          ${pkgs.kubectl}/bin/kubectl rollout status deployment/mongodb -n delivery-tracker --timeout=600s
          ${pkgs.kubectl}/bin/kubectl rollout status deployment/zookeeper -n delivery-tracker --timeout=300s
          ${pkgs.kubectl}/bin/kubectl rollout status statefulset/kafka -n delivery-tracker --timeout=1800s
          ${pkgs.kubectl}/bin/kubectl rollout status deployment/backend -n delivery-tracker --timeout=600s
          ${pkgs.kubectl}/bin/kubectl rollout status deployment/frontend -n delivery-tracker --timeout=300s

          # Setup port forwarding
          echo "Setting up port forwarding..."
          ${pkgs.kubectl}/bin/kubectl port-forward service/frontend-service 4200:80 -n delivery-tracker &
          ${pkgs.kubectl}/bin/kubectl port-forward service/backend-service 8080:8080 -n delivery-tracker &

          # Setup Cloudflare tunnel if token is provided
          if [ -n "$CLOUDFLARE_TOKEN" ]; then
            echo "Setting up Cloudflare tunnel..."
            ./scripts/setup-tunnel.sh &
          fi

          echo "✅ Services started!"
          echo "Frontend: http://localhost:4200"
          echo "Backend API: http://localhost:8080"
          echo "Swagger UI: http://localhost:8080/swagger-ui.html"
          echo "Press Ctrl+C to stop all services"

          wait
        '';
      in {
        devShells.default = pkgs.mkShell {
          buildInputs = devTools ++ [ startScript ];

          shellHook = ''
            echo "🎯 Mini Delivery Tracker Development Environment"
            echo "================================================="
            echo "Available commands:"
            echo "  start            - Start all services"
            echo "  build            - Build all components"
            echo "  minikube start   - Start Minikube cluster"
            echo "  kubectl get pods - Check pod status"
            echo ""
            echo "Java version: ${jdk.version}"
            echo "Node.js version: ${node.version}"
            echo ""

            # Set up environment variables
            export JAVA_HOME="${jdk}/lib/openjdk"
            export PATH="${jdk}/bin:${node}/bin:$PATH"

            # Create local directories if they don't exist
            mkdir -p logs data

            echo "Environment ready! 🚀"
          '';
        };

        packages = {
          dockerImages = pkgs.runCommand "docker-images" {
            buildInputs = [ pkgs.docker ];
          } ''
            mkdir -p $out
            echo "Building Docker images..." > $out/build.log
          '';

          default = startScript;
        };

        apps.default = {
          type = "app";
          program = "${startScript}/bin/start";
        };
      });
}
