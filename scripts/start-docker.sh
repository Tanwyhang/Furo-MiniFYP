#!/bin/bash

# Script to start Docker Desktop on macOS
# For other platforms, this may need modification

set -e

echo "🐳 Starting Docker Desktop..."

# Check platform
case "$(uname -s)" in
   Darwin*)
     echo "macOS detected"
     # Try to start Docker Desktop
     if ! docker info >/dev/null 2>&1; then
         echo "Opening Docker Desktop..."
         open /Applications/Docker.app

         echo "Waiting for Docker to start..."
         for i in {1..30}; do
             if docker info >/dev/null 2>&1; then
                 echo "✅ Docker is ready!"
                 break
             fi
             echo -n "."
             sleep 3
         done
         echo ""
     else
         echo "✅ Docker is already running"
     fi
     ;;
   Linux*)
     echo "Linux detected - please start Docker service manually"
     echo "Run: sudo systemctl start docker"
     ;;
   CYGWIN*|MINGW*|MSYS*)
     echo "Windows detected - please start Docker Desktop manually"
     ;;
   *)
     echo "Unknown platform - please start Docker manually"
     ;;
esac

echo "🎉 Docker setup complete!"