
# 🚀 Zenith API Documentation

## Overview
The Zenith Financial Intelligence Platform provides a comprehensive REST API for financial investigation, fraud detection, and forensic analysis.

## 📋 Table of Contents
- [Authentication](#authentication)
- [Projects](#projects)  
- [Users](#users)
- [Forensics](#forensics)
- [System Health](#system-health)

## 🔐 Authentication

### Login
```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded

username=admin&password=admin123
```

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "username": "newuser", 
    "password": "password123",
    "full_name": "New User"
}
```

## 📁 Projects

### List Projects
```bash
curl -X GET http://localhost:8200/api/v1/projects \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Create Project
```bash
curl -X POST http://localhost:8200/api/v1/projects \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Investigation",
    "description": "Financial investigation case"
  }'
```

## 👥 Users

### List Users (Admin Only)
```bash
curl -X GET http://localhost:8200/api/v1/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🔬 Forensics

### Get Forensic Data
```bash
curl -X GET "http://localhost:8200/api/v1/forensics?project_id=123" \
  -H "Authorization: Bearer <your-jwt-token>"
```

## ⚙️ System Health

### Health Check
```bash
curl -X GET http://localhost:8200/health
```

## 📖 Interactive Documentation

For the best experience, open the interactive documentation:
- Open [api_interactive.html](./api_interactive.html) in your browser
- Includes live testing capabilities
- Multi-language code examples
- Real-time request/response formatting

## 🔧 Development Tools

### Postman Collection
Import the generated Postman collection:
```bash
# Import into Postman
postman collection import docs/postman_collection.json
```

### OpenAPI Specification
Use with API documentation tools:
```bash
# Swagger UI
swagger-ui-cli -u docs/openapi.json

# Redoc  
redoc-cli serve docs/openapi.json
```

## 🚀 Quick Start

1. **Interactive Docs**: Open `docs/api_interactive.html`
2. **Import to Postman**: Load `docs/postman_collection.json`
3. **Automated Testing**: Run `scripts/test_api_examples.py`

## 📞 Support

- **API Support**: api-support@zenith.local
- **Documentation**: [Interactive HTML](./api_interactive.html)
- **Issues**: [GitHub Issues](https://github.com/zenith/api/issues)

---

*Generated on: 2026-01-31 05:58:24*
    