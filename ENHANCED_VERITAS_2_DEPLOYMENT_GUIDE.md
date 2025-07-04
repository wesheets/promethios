# Enhanced Veritas 2 Deployment Guide

## 🚀 Production Deployment Guide

This guide provides step-by-step instructions for deploying Enhanced Veritas 2 in production environments.

## 📋 Prerequisites

### **System Requirements**
- **Operating System**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **Python**: 3.11 or higher
- **Node.js**: 20.x or higher
- **Memory**: Minimum 8GB RAM (16GB+ recommended)
- **Storage**: Minimum 50GB available space
- **CPU**: 4+ cores recommended

### **Dependencies**
- **Database**: PostgreSQL 13+ or MySQL 8+
- **Cache**: Redis 6+ (optional but recommended)
- **Web Server**: Nginx or Apache
- **Process Manager**: PM2, systemd, or supervisor
- **Load Balancer**: Nginx, HAProxy, or cloud load balancer

## 🔧 Installation Steps

### **1. Environment Setup**

```bash
# Create deployment user
sudo useradd -m -s /bin/bash enhanced-veritas
sudo usermod -aG sudo enhanced-veritas

# Switch to deployment user
sudo su - enhanced-veritas

# Create application directory
mkdir -p /opt/enhanced-veritas
cd /opt/enhanced-veritas

# Clone repository (assuming you have access)
git clone https://github.com/your-org/promethios.git
cd promethios
git checkout promethios-multi-system-chat
```

### **2. Python Environment Setup**

```bash
# Install Python dependencies
python3.11 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt

# Install Enhanced Veritas 2 specific dependencies
pip install numpy scipy matplotlib plotly websockets
pip install psycopg2-binary redis celery gunicorn
```

### **3. Node.js Environment Setup**

```bash
# Install Node.js dependencies
cd ui
npm install

# Install Enhanced Veritas 2 UI dependencies
npm install recharts @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material @mui/x-charts websocket

# Build production assets
npm run build
cd ..
```

### **4. Database Setup**

#### **PostgreSQL Setup**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE enhanced_veritas;
CREATE USER enhanced_veritas_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE enhanced_veritas TO enhanced_veritas_user;
ALTER USER enhanced_veritas_user CREATEDB;
\q
```

#### **Initialize Database Schema**
```bash
# Set database URL
export DATABASE_URL="postgresql://enhanced_veritas_user:your_secure_password@localhost/enhanced_veritas"

# Initialize schema
python src/veritas/enhanced/setup/initialize_database.py

# Run migrations
python src/veritas/enhanced/setup/migrate_database.py
```

### **5. Redis Setup (Optional but Recommended)**

```bash
# Install Redis
sudo apt install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf

# Set the following configurations:
# maxmemory 2gb
# maxmemory-policy allkeys-lru
# save 900 1
# save 300 10
# save 60 10000

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### **6. Configuration**

#### **Create Production Configuration**
```bash
# Copy configuration template
cp src/veritas/enhanced/config/enhanced_veritas_config.template.json \
   src/veritas/enhanced/config/enhanced_veritas_config.json

# Edit configuration
nano src/veritas/enhanced/config/enhanced_veritas_config.json
```

#### **Production Configuration Example**
```json
{
  "environment": "production",
  "debug": false,
  "database": {
    "url": "postgresql://enhanced_veritas_user:password@localhost/enhanced_veritas",
    "pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600
  },
  "redis": {
    "url": "redis://localhost:6379/0",
    "max_connections": 50
  },
  "api": {
    "host": "0.0.0.0",
    "port": 5000,
    "workers": 4,
    "timeout": 300,
    "keepalive": 2
  },
  "websocket": {
    "host": "0.0.0.0",
    "port": 5001,
    "max_connections": 1000
  },
  "uncertainty_engine": {
    "enable_quantum_analysis": true,
    "quantum_coherence_time": 1000,
    "uncertainty_threshold": 0.7,
    "auto_hitl_trigger": true
  },
  "hitl_collaboration": {
    "max_concurrent_sessions": 100,
    "session_timeout": 3600,
    "expert_matching_threshold": 0.8
  },
  "multi_agent_orchestration": {
    "max_networks": 50,
    "auto_optimization": true,
    "optimization_interval": 300
  },
  "security": {
    "secret_key": "your-very-secure-secret-key-here",
    "jwt_expiration": 3600,
    "rate_limit": {
      "requests_per_minute": 100,
      "burst_limit": 200
    }
  },
  "logging": {
    "level": "INFO",
    "file": "/var/log/enhanced-veritas/app.log",
    "max_size": "100MB",
    "backup_count": 10
  }
}
```

#### **Environment Variables**
```bash
# Create environment file
nano /opt/enhanced-veritas/.env
```

```bash
# Enhanced Veritas 2 Environment Configuration
ENHANCED_VERITAS_ENV=production
ENHANCED_VERITAS_SECRET_KEY=your-very-secure-secret-key-here
DATABASE_URL=postgresql://enhanced_veritas_user:password@localhost/enhanced_veritas
REDIS_URL=redis://localhost:6379/0

# API Configuration
API_HOST=0.0.0.0
API_PORT=5000
API_WORKERS=4

# WebSocket Configuration
WEBSOCKET_HOST=0.0.0.0
WEBSOCKET_PORT=5001

# Security
JWT_SECRET_KEY=your-jwt-secret-key
CORS_ORIGINS=https://your-domain.com,https://api.your-domain.com

# Monitoring
SENTRY_DSN=your-sentry-dsn-if-using
NEW_RELIC_LICENSE_KEY=your-newrelic-key-if-using
```

### **7. Process Management Setup**

#### **Using systemd**

Create service files:

```bash
# API Service
sudo nano /etc/systemd/system/enhanced-veritas-api.service
```

```ini
[Unit]
Description=Enhanced Veritas 2 API Service
After=network.target postgresql.service redis.service

[Service]
Type=exec
User=enhanced-veritas
Group=enhanced-veritas
WorkingDirectory=/opt/enhanced-veritas/promethios
Environment=PATH=/opt/enhanced-veritas/promethios/venv/bin
EnvironmentFile=/opt/enhanced-veritas/.env
ExecStart=/opt/enhanced-veritas/promethios/venv/bin/gunicorn \
    --bind 0.0.0.0:5000 \
    --workers 4 \
    --timeout 300 \
    --keepalive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --preload \
    src.veritas.enhanced.api.enhanced_veritas_api:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# WebSocket Service
sudo nano /etc/systemd/system/enhanced-veritas-websocket.service
```

```ini
[Unit]
Description=Enhanced Veritas 2 WebSocket Service
After=network.target enhanced-veritas-api.service

[Service]
Type=exec
User=enhanced-veritas
Group=enhanced-veritas
WorkingDirectory=/opt/enhanced-veritas/promethios
Environment=PATH=/opt/enhanced-veritas/promethios/venv/bin
EnvironmentFile=/opt/enhanced-veritas/.env
ExecStart=/opt/enhanced-veritas/promethios/venv/bin/python \
    src/veritas/enhanced/api/websocket_service.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

#### **Enable and Start Services**
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable enhanced-veritas-api
sudo systemctl enable enhanced-veritas-websocket

# Start services
sudo systemctl start enhanced-veritas-api
sudo systemctl start enhanced-veritas-websocket

# Check status
sudo systemctl status enhanced-veritas-api
sudo systemctl status enhanced-veritas-websocket
```

### **8. Web Server Configuration**

#### **Nginx Configuration**
```bash
sudo nano /etc/nginx/sites-available/enhanced-veritas
```

```nginx
upstream enhanced_veritas_api {
    server 127.0.0.1:5000;
    # Add more servers for load balancing
    # server 127.0.0.1:5002;
    # server 127.0.0.1:5003;
}

upstream enhanced_veritas_websocket {
    server 127.0.0.1:5001;
}

server {
    listen 80;
    server_name your-domain.com api.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com api.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # API Routes
    location /api/v2/ {
        proxy_pass http://enhanced_veritas_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
        proxy_buffering off;
    }
    
    # WebSocket Routes
    location /ws/ {
        proxy_pass http://enhanced_veritas_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        proxy_read_timeout 300s;
    }
    
    # Static Files (React App)
    location / {
        root /opt/enhanced-veritas/promethios/ui/build;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Health Check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

#### **Enable Nginx Site**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/enhanced-veritas /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### **9. SSL Certificate Setup**

#### **Using Let's Encrypt (Certbot)**
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com -d api.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### **10. Monitoring and Logging**

#### **Log Directory Setup**
```bash
# Create log directories
sudo mkdir -p /var/log/enhanced-veritas
sudo chown enhanced-veritas:enhanced-veritas /var/log/enhanced-veritas

# Setup log rotation
sudo nano /etc/logrotate.d/enhanced-veritas
```

```
/var/log/enhanced-veritas/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 enhanced-veritas enhanced-veritas
    postrotate
        systemctl reload enhanced-veritas-api
        systemctl reload enhanced-veritas-websocket
    endscript
}
```

#### **Health Check Script**
```bash
nano /opt/enhanced-veritas/health_check.sh
```

```bash
#!/bin/bash

# Enhanced Veritas 2 Health Check Script

API_URL="http://localhost:5000/api/v2/system/status"
WEBSOCKET_URL="ws://localhost:5001"

# Check API health
echo "Checking API health..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $API_RESPONSE -eq 200 ]; then
    echo "✅ API is healthy"
else
    echo "❌ API is unhealthy (HTTP $API_RESPONSE)"
    # Restart API service
    sudo systemctl restart enhanced-veritas-api
fi

# Check WebSocket health
echo "Checking WebSocket health..."
WS_RESPONSE=$(timeout 5 wscat -c $WEBSOCKET_URL -x '{"type":"ping"}' 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ WebSocket is healthy"
else
    echo "❌ WebSocket is unhealthy"
    # Restart WebSocket service
    sudo systemctl restart enhanced-veritas-websocket
fi

# Check database connectivity
echo "Checking database connectivity..."
DB_CHECK=$(python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    print('✅ Database is accessible')
except Exception as e:
    print(f'❌ Database error: {e}')
    exit(1)
")

echo $DB_CHECK

# Check Redis connectivity
echo "Checking Redis connectivity..."
REDIS_CHECK=$(redis-cli ping 2>/dev/null)

if [ "$REDIS_CHECK" = "PONG" ]; then
    echo "✅ Redis is accessible"
else
    echo "❌ Redis is not accessible"
fi

echo "Health check completed at $(date)"
```

```bash
# Make executable
chmod +x /opt/enhanced-veritas/health_check.sh

# Add to crontab for regular health checks
crontab -e
```

```
# Enhanced Veritas 2 Health Check (every 5 minutes)
*/5 * * * * /opt/enhanced-veritas/health_check.sh >> /var/log/enhanced-veritas/health_check.log 2>&1
```

## 🔒 Security Hardening

### **Firewall Configuration**
```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **Database Security**
```bash
# Secure PostgreSQL
sudo nano /etc/postgresql/13/main/postgresql.conf
```

```
# Network security
listen_addresses = 'localhost'
port = 5432

# Connection security
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'

# Logging
log_connections = on
log_disconnections = on
log_statement = 'mod'
```

### **Application Security**
```bash
# Set secure file permissions
chmod 600 /opt/enhanced-veritas/.env
chmod 600 src/veritas/enhanced/config/enhanced_veritas_config.json

# Create dedicated user for database access
sudo -u postgres createuser --no-createdb --no-createrole --no-superuser enhanced_veritas_readonly
```

## 📊 Performance Optimization

### **Database Optimization**
```sql
-- Create indexes for Enhanced Veritas 2 tables
CREATE INDEX idx_uncertainty_sessions_created_at ON uncertainty_sessions(created_at);
CREATE INDEX idx_uncertainty_sessions_agent_id ON uncertainty_sessions(agent_id);
CREATE INDEX idx_hitl_collaborations_session_id ON hitl_collaborations(session_id);
CREATE INDEX idx_agent_networks_created_at ON agent_networks(created_at);

-- Analyze tables for query optimization
ANALYZE uncertainty_sessions;
ANALYZE hitl_collaborations;
ANALYZE agent_networks;
```

### **Redis Optimization**
```bash
# Configure Redis for optimal performance
sudo nano /etc/redis/redis.conf
```

```
# Memory optimization
maxmemory 4gb
maxmemory-policy allkeys-lru

# Persistence optimization
save 900 1
save 300 10
save 60 10000

# Network optimization
tcp-keepalive 300
timeout 0

# Performance optimization
tcp-backlog 511
databases 16
```

### **Application Optimization**
```python
# Add to enhanced_veritas_config.json
{
  "performance": {
    "connection_pool_size": 20,
    "max_overflow": 30,
    "pool_timeout": 30,
    "pool_recycle": 3600,
    "enable_query_cache": true,
    "cache_ttl": 300,
    "enable_compression": true,
    "compression_level": 6
  }
}
```

## 🚀 Scaling Considerations

### **Horizontal Scaling**
```bash
# Run multiple API instances
# Instance 1
gunicorn --bind 0.0.0.0:5000 --workers 4 src.veritas.enhanced.api.enhanced_veritas_api:app

# Instance 2
gunicorn --bind 0.0.0.0:5002 --workers 4 src.veritas.enhanced.api.enhanced_veritas_api:app

# Instance 3
gunicorn --bind 0.0.0.0:5003 --workers 4 src.veritas.enhanced.api.enhanced_veritas_api:app
```

### **Load Balancer Configuration**
```nginx
upstream enhanced_veritas_api {
    least_conn;
    server 127.0.0.1:5000 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5002 weight=1 max_fails=3 fail_timeout=30s;
    server 127.0.0.1:5003 weight=1 max_fails=3 fail_timeout=30s;
}
```

### **Database Scaling**
```bash
# Configure read replicas
# Master database for writes
DATABASE_WRITE_URL=postgresql://user:pass@master-db:5432/enhanced_veritas

# Read replica for reads
DATABASE_READ_URL=postgresql://user:pass@replica-db:5432/enhanced_veritas
```

## 🔍 Troubleshooting

### **Common Issues**

#### **API Service Won't Start**
```bash
# Check logs
sudo journalctl -u enhanced-veritas-api -f

# Check configuration
python -c "import json; print(json.load(open('src/veritas/enhanced/config/enhanced_veritas_config.json')))"

# Test database connection
python -c "import psycopg2; psycopg2.connect('$DATABASE_URL')"
```

#### **High Memory Usage**
```bash
# Monitor memory usage
htop
ps aux | grep enhanced-veritas

# Check for memory leaks
python -m memory_profiler src/veritas/enhanced/api/enhanced_veritas_api.py
```

#### **Slow API Responses**
```bash
# Check database performance
sudo -u postgres psql enhanced_veritas -c "SELECT * FROM pg_stat_activity;"

# Monitor query performance
sudo -u postgres psql enhanced_veritas -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

### **Performance Monitoring**
```bash
# Install monitoring tools
pip install psutil prometheus_client

# Add monitoring endpoint to API
# GET /api/v2/metrics - Prometheus metrics
# GET /api/v2/system/performance - Detailed performance metrics
```

## 📞 Support

For deployment issues or questions:
- Check logs in `/var/log/enhanced-veritas/`
- Review configuration in `src/veritas/enhanced/config/`
- Run health check script: `/opt/enhanced-veritas/health_check.sh`
- Contact support team with deployment details

---

**Enhanced Veritas 2 Deployment Guide** - Production-Ready Deployment for Revolutionary AI Governance

