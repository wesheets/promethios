"""
Deployment infrastructure and CI/CD pipeline for Promethios.

This module provides tools for containerization, orchestration, and automated
deployment/testing to ensure consistent and reliable production deployments.
"""

import os
import yaml
import json
import logging
from typing import Dict, List, Optional, Union, Any

# Configure logging
logger = logging.getLogger(__name__)

class DockerfileGenerator:
    """
    Generator for Dockerfiles based on project requirements.
    
    This class provides methods to generate appropriate Dockerfiles
    for different components of the Promethios system.
    """
    
    BASE_IMAGES = {
        "python": "python:3.11-slim",
        "node": "node:20-alpine",
        "nginx": "nginx:1.25-alpine"
    }
    
    def __init__(self, output_dir: str = "."):
        """
        Initialize the Dockerfile generator.
        
        Args:
            output_dir: Directory to write Dockerfiles
        """
        self.output_dir = output_dir
    
    def generate_api_dockerfile(self, 
                              requirements_file: str = "requirements.txt",
                              entrypoint: str = "src/main.py",
                              port: int = 8000) -> str:
        """
        Generate a Dockerfile for the API service.
        
        Args:
            requirements_file: Path to requirements.txt
            entrypoint: Path to entrypoint script
            port: Port to expose
            
        Returns:
            Path to generated Dockerfile
        """
        dockerfile_content = f"""FROM {self.BASE_IMAGES["python"]}

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \\
    gcc \\
    python3-dev \\
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY {requirements_file} .
RUN pip install --no-cache-dir -r {requirements_file}

# Copy application code
COPY . .

# Create non-root user
RUN groupadd -r promethios && useradd -r -g promethios promethios
RUN chown -R promethios:promethios /app
USER promethios

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE {port}

# Run the application
CMD ["python", "{entrypoint}"]
"""
        
        output_path = os.path.join(self.output_dir, "Dockerfile.api")
        with open(output_path, "w") as f:
            f.write(dockerfile_content)
        
        return output_path
    
    def generate_ui_dockerfile(self, 
                             build_command: str = "npm run build",
                             build_output: str = "dist") -> str:
        """
        Generate a Dockerfile for the UI service.
        
        Args:
            build_command: Command to build the UI
            build_output: Directory containing build output
            
        Returns:
            Path to generated Dockerfile
        """
        dockerfile_content = f"""# Build stage
FROM {self.BASE_IMAGES["node"]} as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN {build_command}

# Production stage
FROM {self.BASE_IMAGES["nginx"]}

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/{build_output} /usr/share/nginx/html

# Expose port
EXPOSE 80

# Run nginx
CMD ["nginx", "-g", "daemon off;"]
"""
        
        output_path = os.path.join(self.output_dir, "Dockerfile.ui")
        with open(output_path, "w") as f:
            f.write(dockerfile_content)
        
        # Generate nginx.conf if it doesn't exist
        nginx_conf_path = os.path.join(self.output_dir, "nginx.conf")
        if not os.path.exists(nginx_conf_path):
            nginx_conf = """server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \\.(?:jpg|jpeg|gif|png|ico|svg|woff|woff2|ttf|css|js)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000";
    }
    
    # Security headers
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; connect-src 'self' https://api.promethios.io;";
}
"""
            with open(nginx_conf_path, "w") as f:
                f.write(nginx_conf)
        
        return output_path

class DockerComposeGenerator:
    """
    Generator for Docker Compose configuration.
    
    This class provides methods to generate Docker Compose files
    for local development and testing.
    """
    
    def __init__(self, output_dir: str = "."):
        """
        Initialize the Docker Compose generator.
        
        Args:
            output_dir: Directory to write Docker Compose files
        """
        self.output_dir = output_dir
    
    def generate_compose_file(self, 
                             services: List[Dict[str, Any]],
                             networks: Optional[Dict[str, Any]] = None,
                             volumes: Optional[Dict[str, Any]] = None) -> str:
        """
        Generate a Docker Compose file.
        
        Args:
            services: List of service configurations
            networks: Network configurations
            volumes: Volume configurations
            
        Returns:
            Path to generated Docker Compose file
        """
        compose_config = {
            "version": "3.8",
            "services": {}
        }
        
        # Add services
        for service in services:
            name = service.pop("name")
            compose_config["services"][name] = service
        
        # Add networks if provided
        if networks:
            compose_config["networks"] = networks
        
        # Add volumes if provided
        if volumes:
            compose_config["volumes"] = volumes
        
        # Write to file
        output_path = os.path.join(self.output_dir, "docker-compose.yml")
        with open(output_path, "w") as f:
            yaml.dump(compose_config, f, default_flow_style=False)
        
        return output_path
    
    def generate_development_compose(self) -> str:
        """
        Generate a Docker Compose file for development.
        
        Returns:
            Path to generated Docker Compose file
        """
        services = [
            {
                "name": "api",
                "build": {
                    "context": ".",
                    "dockerfile": "Dockerfile.api"
                },
                "ports": ["8000:8000"],
                "volumes": ["./:/app"],
                "environment": {
                    "ENVIRONMENT": "development",
                    "DATABASE_URL": "postgresql://postgres:postgres@db:5432/promethios",
                    "REDIS_URL": "redis://redis:6379/0"
                },
                "depends_on": ["db", "redis"]
            },
            {
                "name": "ui",
                "build": {
                    "context": "./ui",
                    "dockerfile": "Dockerfile.ui"
                },
                "ports": ["3000:80"],
                "volumes": ["./ui:/app"],
                "environment": {
                    "API_URL": "http://api:8000"
                }
            },
            {
                "name": "db",
                "image": "postgres:15-alpine",
                "ports": ["5432:5432"],
                "environment": {
                    "POSTGRES_USER": "postgres",
                    "POSTGRES_PASSWORD": "postgres",
                    "POSTGRES_DB": "promethios"
                },
                "volumes": ["postgres_data:/var/lib/postgresql/data"]
            },
            {
                "name": "redis",
                "image": "redis:7-alpine",
                "ports": ["6379:6379"],
                "volumes": ["redis_data:/data"]
            }
        ]
        
        volumes = {
            "postgres_data": {},
            "redis_data": {}
        }
        
        return self.generate_compose_file(services, volumes=volumes)

class KubernetesGenerator:
    """
    Generator for Kubernetes manifests.
    
    This class provides methods to generate Kubernetes manifests
    for production deployment.
    """
    
    def __init__(self, output_dir: str = "./k8s"):
        """
        Initialize the Kubernetes generator.
        
        Args:
            output_dir: Directory to write Kubernetes manifests
        """
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
    
    def generate_deployment(self, 
                           name: str,
                           image: str,
                           replicas: int = 1,
                           port: int = 80,
                           env_vars: Optional[Dict[str, str]] = None,
                           resources: Optional[Dict[str, Any]] = None,
                           labels: Optional[Dict[str, str]] = None) -> str:
        """
        Generate a Kubernetes Deployment manifest.
        
        Args:
            name: Deployment name
            image: Container image
            replicas: Number of replicas
            port: Container port
            env_vars: Environment variables
            resources: Resource requests and limits
            labels: Pod labels
            
        Returns:
            Path to generated manifest
        """
        # Default values
        if labels is None:
            labels = {"app": name}
        
        if resources is None:
            resources = {
                "requests": {
                    "cpu": "100m",
                    "memory": "128Mi"
                },
                "limits": {
                    "cpu": "500m",
                    "memory": "512Mi"
                }
            }
        
        # Create deployment manifest
        deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": name,
                "labels": labels
            },
            "spec": {
                "replicas": replicas,
                "selector": {
                    "matchLabels": labels
                },
                "template": {
                    "metadata": {
                        "labels": labels
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": name,
                                "image": image,
                                "ports": [
                                    {"containerPort": port}
                                ],
                                "resources": resources
                            }
                        ]
                    }
                }
            }
        }
        
        # Add environment variables if provided
        if env_vars:
            env_list = []
            for key, value in env_vars.items():
                env_list.append({
                    "name": key,
                    "value": value
                })
            
            deployment["spec"]["template"]["spec"]["containers"][0]["env"] = env_list
        
        # Write to file
        output_path = os.path.join(self.output_dir, f"{name}-deployment.yaml")
        with open(output_path, "w") as f:
            yaml.dump(deployment, f, default_flow_style=False)
        
        return output_path
    
    def generate_service(self, 
                        name: str,
                        port: int = 80,
                        target_port: int = 80,
                        service_type: str = "ClusterIP",
                        selector: Optional[Dict[str, str]] = None) -> str:
        """
        Generate a Kubernetes Service manifest.
        
        Args:
            name: Service name
            port: Service port
            target_port: Target port on the pods
            service_type: Service type (ClusterIP, NodePort, LoadBalancer)
            selector: Pod selector
            
        Returns:
            Path to generated manifest
        """
        # Default values
        if selector is None:
            selector = {"app": name}
        
        # Create service manifest
        service = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": name
            },
            "spec": {
                "type": service_type,
                "ports": [
                    {
                        "port": port,
                        "targetPort": target_port,
                        "protocol": "TCP"
                    }
                ],
                "selector": selector
            }
        }
        
        # Write to file
        output_path = os.path.join(self.output_dir, f"{name}-service.yaml")
        with open(output_path, "w") as f:
            yaml.dump(service, f, default_flow_style=False)
        
        return output_path
    
    def generate_ingress(self, 
                        name: str,
                        host: str,
                        service_name: str,
                        service_port: int = 80,
                        tls: bool = True) -> str:
        """
        Generate a Kubernetes Ingress manifest.
        
        Args:
            name: Ingress name
            host: Hostname
            service_name: Backend service name
            service_port: Backend service port
            tls: Whether to enable TLS
            
        Returns:
            Path to generated manifest
        """
        # Create ingress manifest
        ingress = {
            "apiVersion": "networking.k8s.io/v1",
            "kind": "Ingress",
            "metadata": {
                "name": name,
                "annotations": {
                    "kubernetes.io/ingress.class": "nginx",
                    "nginx.ingress.kubernetes.io/ssl-redirect": "true" if tls else "false"
                }
            },
            "spec": {
                "rules": [
                    {
                        "host": host,
                        "http": {
                            "paths": [
                                {
                                    "path": "/",
                                    "pathType": "Prefix",
                                    "backend": {
                                        "service": {
                                            "name": service_name,
                                            "port": {
                                                "number": service_port
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
        
        # Add TLS configuration if enabled
        if tls:
            ingress["spec"]["tls"] = [
                {
                    "hosts": [host],
                    "secretName": f"{name}-tls"
                }
            ]
        
        # Write to file
        output_path = os.path.join(self.output_dir, f"{name}-ingress.yaml")
        with open(output_path, "w") as f:
            yaml.dump(ingress, f, default_flow_style=False)
        
        return output_path
    
    def generate_config_map(self, 
                           name: str,
                           data: Dict[str, str]) -> str:
        """
        Generate a Kubernetes ConfigMap manifest.
        
        Args:
            name: ConfigMap name
            data: ConfigMap data
            
        Returns:
            Path to generated manifest
        """
        # Create config map manifest
        config_map = {
            "apiVersion": "v1",
            "kind": "ConfigMap",
            "metadata": {
                "name": name
            },
            "data": data
        }
        
        # Write to file
        output_path = os.path.join(self.output_dir, f"{name}-configmap.yaml")
        with open(output_path, "w") as f:
            yaml.dump(config_map, f, default_flow_style=False)
        
        return output_path
    
    def generate_secret(self, 
                       name: str,
                       data: Dict[str, str],
                       secret_type: str = "Opaque") -> str:
        """
        Generate a Kubernetes Secret manifest.
        
        Args:
            name: Secret name
            data: Secret data (values will be base64 encoded)
            secret_type: Secret type
            
        Returns:
            Path to generated manifest
        """
        import base64
        
        # Encode data
        encoded_data = {}
        for key, value in data.items():
            encoded_data[key] = base64.b64encode(value.encode()).decode()
        
        # Create secret manifest
        secret = {
            "apiVersion": "v1",
            "kind": "Secret",
            "metadata": {
                "name": name
            },
            "type": secret_type,
            "data": encoded_data
        }
        
        # Write to file
        output_path = os.path.join(self.output_dir, f"{name}-secret.yaml")
        with open(output_path, "w") as f:
            yaml.dump(secret, f, default_flow_style=False)
        
        return output_path
    
    def generate_complete_deployment(self, 
                                    api_image: str,
                                    ui_image: str,
                                    domain: str,
                                    db_password: str) -> List[str]:
        """
        Generate a complete set of Kubernetes manifests for Promethios.
        
        Args:
            api_image: API container image
            ui_image: UI container image
            domain: Domain name
            db_password: Database password
            
        Returns:
            List of paths to generated manifests
        """
        paths = []
        
        # Generate namespace
        namespace = {
            "apiVersion": "v1",
            "kind": "Namespace",
            "metadata": {
                "name": "promethios"
            }
        }
        namespace_path = os.path.join(self.output_dir, "namespace.yaml")
        with open(namespace_path, "w") as f:
            yaml.dump(namespace, f, default_flow_style=False)
        paths.append(namespace_path)
        
        # Generate database deployment and service
        db_deployment = self.generate_deployment(
            name="postgres",
            image="postgres:15-alpine",
            port=5432,
            env_vars={
                "POSTGRES_USER": "postgres",
                "POSTGRES_PASSWORD": db_password,
                "POSTGRES_DB": "promethios"
            },
            resources={
                "requests": {
                    "cpu": "100m",
                    "memory": "256Mi"
                },
                "limits": {
                    "cpu": "500m",
                    "memory": "1Gi"
                }
            }
        )
        paths.append(db_deployment)
        
        db_service = self.generate_service(
            name="postgres",
            port=5432,
            target_port=5432
        )
        paths.append(db_service)
        
        # Generate Redis deployment and service
        redis_deployment = self.generate_deployment(
            name="redis",
            image="redis:7-alpine",
            port=6379,
            resources={
                "requests": {
                    "cpu": "100m",
                    "memory": "128Mi"
                },
                "limits": {
                    "cpu": "200m",
                    "memory": "256Mi"
                }
            }
        )
        paths.append(redis_deployment)
        
        redis_service = self.generate_service(
            name="redis",
            port=6379,
            target_port=6379
        )
        paths.append(redis_service)
        
        # Generate API deployment and service
        api_deployment = self.generate_deployment(
            name="api",
            image=api_image,
            replicas=2,
            port=8000,
            env_vars={
                "ENVIRONMENT": "production",
                "DATABASE_URL": f"postgresql://postgres:{db_password}@postgres:5432/promethios",
                "REDIS_URL": "redis://redis:6379/0"
            },
            resources={
                "requests": {
                    "cpu": "200m",
                    "memory": "256Mi"
                },
                "limits": {
                    "cpu": "1000m",
                    "memory": "1Gi"
                }
            }
        )
        paths.append(api_deployment)
        
        api_service = self.generate_service(
            name="api",
            port=80,
            target_port=8000
        )
        paths.append(api_service)
        
        # Generate UI deployment and service
        ui_deployment = self.generate_deployment(
            name="ui",
            image=ui_image,
            replicas=2,
            port=80,
            resources={
                "requests": {
                    "cpu": "100m",
                    "memory": "128Mi"
                },
                "limits": {
                    "cpu": "200m",
                    "memory": "256Mi"
                }
            }
        )
        paths.append(ui_deployment)
        
        ui_service = self.generate_service(
            name="ui",
            port=80,
            target_port=80
        )
        paths.append(ui_service)
        
        # Generate ingress for API and UI
        api_ingress = self.generate_ingress(
            name="api-ingress",
            host=f"api.{domain}",
            service_name="api",
            service_port=80,
            tls=True
        )
        paths.append(api_ingress)
        
        ui_ingress = self.generate_ingress(
            name="ui-ingress",
            host=domain,
            service_name="ui",
            service_port=80,
            tls=True
        )
        paths.append(ui_ingress)
        
        return paths

class CICDGenerator:
    """
    Generator for CI/CD pipeline configurations.
    
    This class provides methods to generate CI/CD pipeline configurations
    for various platforms like GitHub Actions, GitLab CI, and Jenkins.
    """
    
    def __init__(self, output_dir: str = "."):
        """
        Initialize the CI/CD generator.
        
        Args:
            output_dir: Directory to write CI/CD configurations
        """
        self.output_dir = output_dir
    
    def generate_github_actions(self) -> str:
        """
        Generate GitHub Actions workflow configuration.
        
        Returns:
            Path to generated workflow file
        """
        # Create GitHub Actions directory if it doesn't exist
        github_dir = os.path.join(self.output_dir, ".github", "workflows")
        os.makedirs(github_dir, exist_ok=True)
        
        # Create workflow configuration
        workflow = {
            "name": "Promethios CI/CD",
            "on": {
                "push": {
                    "branches": ["main", "stable/*"],
                    "tags": ["v*"]
                },
                "pull_request": {
                    "branches": ["main", "stable/*"]
                }
            },
            "jobs": {
                "test": {
                    "runs-on": "ubuntu-latest",
                    "steps": [
                        {
                            "name": "Checkout code",
                            "uses": "actions/checkout@v3"
                        },
                        {
                            "name": "Set up Python",
                            "uses": "actions/setup-python@v4",
                            "with": {
                                "python-version": "3.11"
                            }
                        },
                        {
                            "name": "Install dependencies",
                            "run": "pip install -r requirements.txt"
                        },
                        {
                            "name": "Run tests",
                            "run": "pytest"
                        },
                        {
                            "name": "Run security scan",
                            "run": "pip install bandit && bandit -r src/"
                        }
                    ]
                },
                "build": {
                    "needs": "test",
                    "runs-on": "ubuntu-latest",
                    "if": "github.event_name == 'push'",
                    "steps": [
                        {
                            "name": "Checkout code",
                            "uses": "actions/checkout@v3"
                        },
                        {
                            "name": "Set up Docker Buildx",
                            "uses": "docker/setup-buildx-action@v2"
                        },
                        {
                            "name": "Login to DockerHub",
                            "uses": "docker/login-action@v2",
                            "with": {
                                "username": "${{ secrets.DOCKERHUB_USERNAME }}",
                                "password": "${{ secrets.DOCKERHUB_TOKEN }}"
                            }
                        },
                        {
                            "name": "Extract metadata",
                            "id": "meta",
                            "uses": "docker/metadata-action@v4",
                            "with": {
                                "images": "promethios/api",
                                "tags": [
                                    "type=ref,event=branch",
                                    "type=ref,event=pr",
                                    "type=semver,pattern={{version}}",
                                    "type=sha"
                                ]
                            }
                        },
                        {
                            "name": "Build and push API image",
                            "uses": "docker/build-push-action@v4",
                            "with": {
                                "context": ".",
                                "file": "./Dockerfile.api",
                                "push": True,
                                "tags": "${{ steps.meta.outputs.tags }}",
                                "labels": "${{ steps.meta.outputs.labels }}"
                            }
                        }
                    ]
                },
                "deploy": {
                    "needs": "build",
                    "runs-on": "ubuntu-latest",
                    "if": "startsWith(github.ref, 'refs/tags/v')",
                    "steps": [
                        {
                            "name": "Checkout code",
                            "uses": "actions/checkout@v3"
                        },
                        {
                            "name": "Set up kubectl",
                            "uses": "azure/setup-kubectl@v3"
                        },
                        {
                            "name": "Configure kubectl",
                            "run": "echo \"${{ secrets.KUBE_CONFIG }}\" > kubeconfig.yaml",
                            "shell": "bash"
                        },
                        {
                            "name": "Deploy to Kubernetes",
                            "run": "kubectl --kubeconfig=kubeconfig.yaml apply -f k8s/",
                            "shell": "bash"
                        }
                    ]
                }
            }
        }
        
        # Write to file
        output_path = os.path.join(github_dir, "ci-cd.yml")
        with open(output_path, "w") as f:
            yaml.dump(workflow, f, default_flow_style=False)
        
        return output_path
    
    def generate_gitlab_ci(self) -> str:
        """
        Generate GitLab CI configuration.
        
        Returns:
            Path to generated configuration file
        """
        # Create GitLab CI configuration
        gitlab_ci = """stages:
  - test
  - build
  - deploy

variables:
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""

test:
  stage: test
  image: python:3.11-slim
  script:
    - pip install -r requirements.txt
    - pytest
    - pip install bandit && bandit -r src/
  artifacts:
    reports:
      junit: report.xml

build:
  stage: build
  image: docker:20.10
  services:
    - docker:20.10-dind
  script:
    - docker login -u $CI_REGISTRY_USER -p $CI_REGISTRY_PASSWORD $CI_REGISTRY
    - docker build -t $CI_REGISTRY_IMAGE/api:$CI_COMMIT_REF_SLUG -f Dockerfile.api .
    - docker push $CI_REGISTRY_IMAGE/api:$CI_COMMIT_REF_SLUG
  only:
    - main
    - /^stable\/.*$/
    - tags

deploy:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true
    - kubectl config set-credentials admin --token="$KUBE_TOKEN"
    - kubectl config set-context default --cluster=k8s --user=admin
    - kubectl config use-context default
    - kubectl apply -f k8s/
  only:
    - tags
"""
        
        # Write to file
        output_path = os.path.join(self.output_dir, ".gitlab-ci.yml")
        with open(output_path, "w") as f:
            f.write(gitlab_ci)
        
        return output_path
    
    def generate_jenkins_pipeline(self) -> str:
        """
        Generate Jenkins pipeline configuration.
        
        Returns:
            Path to generated configuration file
        """
        # Create Jenkins pipeline configuration
        jenkins_pipeline = """pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: python
    image: python:3.11-slim
    command:
    - cat
    tty: true
  - name: docker
    image: docker:20.10
    command:
    - cat
    tty: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: docker-sock
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
    - cat
    tty: true
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    
    stages {
        stage('Test') {
            steps {
                container('python') {
                    sh 'pip install -r requirements.txt'
                    sh 'pytest'
                    sh 'pip install bandit && bandit -r src/'
                }
            }
        }
        
        stage('Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'stable/*'
                    tag 'v*'
                }
            }
            steps {
                container('docker') {
                    sh 'docker login -u $DOCKER_USERNAME -p $DOCKER_PASSWORD'
                    sh 'docker build -t promethios/api:$GIT_COMMIT -f Dockerfile.api .'
                    sh 'docker push promethios/api:$GIT_COMMIT'
                    
                    script {
                        if (env.TAG_NAME) {
                            sh 'docker tag promethios/api:$GIT_COMMIT promethios/api:$TAG_NAME'
                            sh 'docker push promethios/api:$TAG_NAME'
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                tag 'v*'
            }
            steps {
                container('kubectl') {
                    sh 'kubectl config set-cluster k8s --server="$KUBE_URL" --insecure-skip-tls-verify=true'
                    sh 'kubectl config set-credentials admin --token="$KUBE_TOKEN"'
                    sh 'kubectl config set-context default --cluster=k8s --user=admin'
                    sh 'kubectl config use-context default'
                    sh 'kubectl apply -f k8s/'
                }
            }
        }
    }
    
    post {
        always {
            junit 'report.xml'
        }
    }
}
"""
        
        # Write to file
        output_path = os.path.join(self.output_dir, "Jenkinsfile")
        with open(output_path, "w") as f:
            f.write(jenkins_pipeline)
        
        return output_path

def generate_deployment_infrastructure(output_dir: str = ".") -> Dict[str, List[str]]:
    """
    Generate deployment infrastructure files.
    
    Args:
        output_dir: Directory to write files
        
    Returns:
        Dictionary with paths to generated files
    """
    result = {
        "dockerfiles": [],
        "docker_compose": [],
        "kubernetes": [],
        "ci_cd": []
    }
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    # Generate Dockerfiles
    dockerfile_generator = DockerfileGenerator(output_dir)
    result["dockerfiles"].append(dockerfile_generator.generate_api_dockerfile())
    result["dockerfiles"].append(dockerfile_generator.generate_ui_dockerfile())
    
    # Generate Docker Compose file
    compose_generator = DockerComposeGenerator(output_dir)
    result["docker_compose"].append(compose_generator.generate_development_compose())
    
    # Generate Kubernetes manifests
    k8s_dir = os.path.join(output_dir, "k8s")
    kubernetes_generator = KubernetesGenerator(k8s_dir)
    result["kubernetes"].extend(kubernetes_generator.generate_complete_deployment(
        api_image="promethios/api:latest",
        ui_image="promethios/ui:latest",
        domain="promethios.io",
        db_password="change-me-in-production"
    ))
    
    # Generate CI/CD configurations
    cicd_generator = CICDGenerator(output_dir)
    result["ci_cd"].append(cicd_generator.generate_github_actions())
    result["ci_cd"].append(cicd_generator.generate_gitlab_ci())
    result["ci_cd"].append(cicd_generator.generate_jenkins_pipeline())
    
    return result
