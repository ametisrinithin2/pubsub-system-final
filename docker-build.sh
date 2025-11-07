#!/bin/bash

##
## Docker build and test script
## Builds the Docker image and optionally runs it for testing
##

set -e  # Exit on error

IMAGE_NAME="pubsub-app"
CONTAINER_NAME="pubsub-test"
PORT="3000"

echo "=== Building Docker Image ==="
echo ""

# Build the image
docker build -t $IMAGE_NAME .

echo ""
echo "✓ Docker image built successfully"
echo ""

# Check if we should run the container
if [ "$1" == "run" ]; then
  echo "=== Running Container ==="
  echo ""
  
  # Stop and remove existing container if it exists
  docker stop $CONTAINER_NAME 2>/dev/null || true
  docker rm $CONTAINER_NAME 2>/dev/null || true
  
  # Run the container
  docker run -d \
    -p $PORT:$PORT \
    --name $CONTAINER_NAME \
    $IMAGE_NAME
  
  echo "✓ Container started: $CONTAINER_NAME"
  echo "✓ Accessible at: http://localhost:$PORT"
  echo ""
  echo "View logs:"
  echo "  docker logs -f $CONTAINER_NAME"
  echo ""
  echo "Stop container:"
  echo "  docker stop $CONTAINER_NAME"
  echo ""
  echo "Remove container:"
  echo "  docker rm $CONTAINER_NAME"
  echo ""
  
  # Wait a moment for container to start
  sleep 2
  
  # Show initial logs
  echo "=== Initial Logs ==="
  docker logs $CONTAINER_NAME
  
elif [ "$1" == "test" ]; then
  echo "=== Testing Container ==="
  echo ""
  
  # Stop and remove existing container if it exists
  docker stop $CONTAINER_NAME 2>/dev/null || true
  docker rm $CONTAINER_NAME 2>/dev/null || true
  
  # Run container
  docker run -d -p $PORT:$PORT --name $CONTAINER_NAME $IMAGE_NAME
  
  echo "Waiting for server to start..."
  sleep 5
  
  # Test health endpoint
  echo "Testing /api/health..."
  curl -s http://localhost:$PORT/api/health | jq '.' || echo "Failed to connect"
  echo ""
  
  # Test topics endpoint
  echo "Testing /api/topics..."
  curl -s http://localhost:$PORT/api/topics | jq '.' || echo "Failed to connect"
  echo ""
  
  # Stop container
  echo "Stopping container..."
  docker stop $CONTAINER_NAME
  docker rm $CONTAINER_NAME
  
  echo "✓ Tests complete"
  
else
  echo "Docker image built successfully!"
  echo ""
  echo "To run the container:"
  echo "  ./docker-build.sh run"
  echo ""
  echo "To build and test:"
  echo "  ./docker-build.sh test"
  echo ""
  echo "To run manually:"
  echo "  docker run -d -p 3000:3000 --name pubsub $IMAGE_NAME"
fi

