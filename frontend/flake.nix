{
  description = "Docker image for Angular frontend";
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; };
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system}; # Build the Angular application
      angularApp = pkgs.buildNpmPackage {
        pname = "delivery-tracker-frontend";
        version = "0.1.0"; # Adjust version as needed
        src = self;
        npmDepsHash = "sha256-ztVgL6j3s/jHDU64mWyPsQfsR17CDGkTfWYSNnAMVSU=";
        nativeBuildInputs = [ pkgs.nodejs_20 ];
        npmInstallFlags = [ "--frozen-lockfile" "--offline" ];
        buildPhase = ''
          export NG_CLI_ANALYTICS=false
          npm run build:prod
        '';
        installPhase = ''
          mkdir -p $out
          cp -r dist/delivery-tracker-frontend/* $out/
        '';
      };
    in {
      packages.${system}.dockerImage = pkgs.dockerTools.buildLayeredImage {
        name = "delivery-tracker-frontend";
        tag = "latest";
        contents = [
          pkgs.nginx
          pkgs.busybox # For wget via busybox
          pkgs.curl # To match Dockerfile
        ];

        extraCommands = ''
          # Set up nginx directories
          mkdir -p usr/share/nginx/html
          cp -r ${angularApp}/* usr/share/nginx/html/

          # Copy custom nginx config
          mkdir -p etc/nginx/conf.d
          cp ${self}/nginx.conf etc/nginx/conf.d/default.conf
        '';

        config = {
          Cmd = [ "${pkgs.nginx}/bin/nginx" "-g" "daemon off;" ];
          ExposedPorts = { "80/tcp" = { }; };
          Healthcheck = {
            Test = [
              "CMD"
              "wget"
              "--no-verbose"
              "--tries=1"
              "--spider"
              "http://localhost:80/health"
            ];
            Interval = 30 * 1000000000; # 30s
            Timeout = 3 * 1000000000; # 3s
            StartPeriod = 5 * 1000000000; # 5s
            Retries = 3;
          };
        };
      };

      defaultPackage.${system} = self.packages.${system}.dockerImage;
    };
}
