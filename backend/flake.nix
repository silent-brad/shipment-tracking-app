{
  description = "Delivery Tracker Backend Docker Image";
  inputs = { nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable"; };
  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      # Build the Spring Boot JAR using Maven
      app = pkgs.maven.buildMavenPackage rec {
        pname = "delivery-tracker-backend";
        version = "1.0.0";

        src = ./.;

        mvnHash = "sha256-INeAhUGqr15j4Y4Tg2uAEkwcLxcQ3sQkhZUwWX/+t4Y=";

        nativeBuildInputs = with pkgs; [ openjdk21 ];

        installPhase = ''
          mkdir -p $out/lib
          install -Dm644 target/${pname}-${version}.jar $out/lib/app.jar
        '';
      };

    in {
      packages.${system}.dockerImage = pkgs.dockerTools.buildLayeredImage {
        name = "delivery-tracker-backend";
        tag = "latest";

        contents = with pkgs; [ openjdk21_headless app ];

        config = {
          Cmd = [
            "${pkgs.openjdk21_headless}/bin/java"
            "-jar"
            "${app}/lib/app.jar"
          ];
          ExposedPorts = { "8080/tcp" = { }; };
          Env = [ "JAVA_OPTS=-Xmx512m -Xms256m" "SERVER_PORT=8080" ];
          WorkingDir = "/";
        };
      };

      defaultPackage.${system} = self.packages.${system}.dockerImage;

    };
}
