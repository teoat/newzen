#!/usr/bin/env python3
"""
Standalone API Documentation Generator
Creates comprehensive API documentation without requiring app imports
"""

import json
import os
from datetime import datetime

def generate_standalone_docs():
    """Generate standalone API documentation"""
    
    print("🚀 Generating Zenith API Documentation (Standalone)...")
    
    # Create docs directory
    os.makedirs("docs", exist_ok=True)
    
    # Generate API endpoints documentation
    api_endpoints = {
        "Authentication": {
            "POST /api/v1/auth/login": {
                "description": "Authenticate user and get JWT token",
                "parameters": {
                    "username": {"type": "string", "required": True, "example": "admin"},
                    "password": {"type": "string", "required": True, "example": "admin123"}
                },
                "responses": {
                    "200": {"description": "Successful login", "schema": {"access_token": "string", "token_type": "string"}},
                    "401": {"description": "Invalid credentials"}
                },
                "examples": {
                    "curl": '''curl -X POST http://localhost:8200/api/v1/auth/login \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "username=admin&password=admin123"''',
                    "python": '''import requests

response = requests.post(
    "http://localhost:8200/api/v1/auth/login",
    data={"username": "admin", "password": "admin123"}
)
print(response.json())''',
                    "javascript": '''fetch('http://localhost:8200/api/v1/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: 'username=admin&password=admin123'
})
.then(response => response.json())
.then(data => console.log(data))'''
                }
            },
            "POST /api/v1/auth/register": {
                "description": "Register new user",
                "parameters": {
                    "email": {"type": "string", "required": True, "example": "user@example.com"},
                    "username": {"type": "string", "required": True, "example": "newuser"},
                    "password": {"type": "string", "required": True, "example": "password123"},
                    "full_name": {"type": "string", "required": False, "example": "New User"}
                }
            }
        },
        "Projects": {
            "GET /api/v1/projects": {
                "description": "Get all projects for current user",
                "responses": {
                    "200": {"description": "List of projects", "schema": {"projects": [{"id": "string", "name": "string"}]}}
                },
                "examples": {
                    "curl": '''curl -X GET http://localhost:8200/api/v1/projects \\
  -H "Authorization: Bearer <your-jwt-token>"''',
                    "python": '''import requests

headers = {"Authorization": "Bearer <your-jwt-token>"}
response = requests.get("http://localhost:8200/api/v1/projects", headers=headers)
print(response.json())'''
                }
            },
            "POST /api/v1/projects": {
                "description": "Create new project",
                "parameters": {
                    "name": {"type": "string", "required": True, "example": "New Investigation"},
                    "description": {"type": "string", "required": True, "example": "Financial investigation case"}
                },
                "examples": {
                    "curl": '''curl -X POST http://localhost:8200/api/v1/projects \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "New Investigation", "description": "Financial investigation case"}' ''',
                    "python": '''import requests

headers = {
    "Authorization": "Bearer <your-jwt-token>",
    "Content-Type": "application/json"
}

data = {
    "name": "New Investigation",
    "description": "Financial investigation case"
}

response = requests.post("http://localhost:8200/api/v1/projects", headers=headers, json=data)
print(response.json())'''
                }
            }
        },
        "Users": {
            "GET /api/v1/users": {
                "description": "Get all users (admin only)",
                "responses": {
                    "200": {"description": "List of users", "schema": {"users": [{"id": "string", "username": "string", "email": "string"}]}}
                }
            }
        },
        "Forensics": {
            "GET /api/v1/forensics": {
                "description": "Get forensic analysis data",
                "parameters": {
                    "project_id": {"type": "string", "required": False, "example": "project_123"}
                }
            }
        },
        "System": {
            "GET /health": {
                "description": "System health check",
                "responses": {
                    "200": {"description": "System is healthy", "schema": {"status": "string", "timestamp": "string"}}
                },
                "examples": {
                    "curl": 'curl -X GET http://localhost:8200/health',
                    "python": '''import requests
response = requests.get("http://localhost:8200/health")
print(response.json())'''
                }
            }
        }
    }
    
    # Generate interactive HTML documentation
    interactive_html = generate_interactive_html(api_endpoints)
    with open("docs/api_interactive.html", "w", encoding="utf-8") as f:
        f.write(interactive_html)
    print("✅ Interactive docs saved to docs/api_interactive.html")
    
    # Generate Postman collection
    postman_collection = generate_postman_collection(api_endpoints)
    with open("docs/postman_collection.json", "w", encoding="utf-8") as f:
        json.dump(postman_collection, f, indent=2)
    print("✅ Postman collection saved to docs/postman_collection.json")
    
    # Generate OpenAPI specification
    openapi_spec = generate_openapi_spec(api_endpoints)
    with open("docs/openapi.json", "w", encoding="utf-8") as f:
        json.dump(openapi_spec, f, indent=2)
    print("✅ OpenAPI spec saved to docs/openapi.json")
    
    # Generate comprehensive README
    readme_content = generate_comprehensive_readme(api_endpoints)
    with open("docs/README.md", "w", encoding="utf-8") as f:
        f.write(readme_content)
    print("✅ Comprehensive documentation saved to docs/README.md")
    
    print("\\n🎉 Standalone API documentation generated successfully!")

def generate_interactive_html(endpoints) -> str:
    """Generate interactive HTML documentation"""
    
    html_content = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith API Documentation</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
        .header {{ text-align: center; margin-bottom: 40px; padding: 40px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px; }}
        .header h1 {{ font-size: 2.5rem; margin-bottom: 10px; }}
        .header p {{ font-size: 1.2rem; opacity: 0.9; }}
        .search-box {{ margin-bottom: 30px; position: relative; }}
        .search-box input {{ width: 100%; padding: 15px 20px; font-size: 16px; border: 2px solid #e1e5e9; border-radius: 10px; outline: none; transition: border-color 0.3s; }}
        .search-box input:focus {{ border-color: #667eea; }}
        .api-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 25px; }}
        .category-card {{ background: white; border-radius: 15px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; }}
        .category-card:hover {{ transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.15); }}
        .category-title {{ font-size: 1.5rem; font-weight: bold; color: #2c3e50; margin-bottom: 15px; display: flex; align-items: center; }}
        .category-icon {{ margin-right: 10px; font-size: 1.8rem; }}
        .endpoint {{ border-left: 4px solid #3498db; padding: 15px; margin-bottom: 15px; background: #f8f9fa; border-radius: 0 8px 8px 0; }}
        .endpoint:hover {{ background: #e3f2fd; }}
        .endpoint-method {{ font-weight: bold; color: #2980b9; margin-right: 10px; min-width: 60px; display: inline-block; }}
        .endpoint-path {{ font-family: 'Monaco', 'Consolas', monospace; font-size: 1.1rem; }}
        .endpoint-description {{ margin: 10px 0; color: #555; }}
        .examples {{ margin-top: 15px; }}
        .example-tabs {{ display: flex; gap: 5px; margin-bottom: 15px; }}
        .example-tab {{ padding: 8px 16px; background: #ecf0f1; border: none; border-radius: 20px; cursor: pointer; font-size: 14px; transition: all 0.3s; }}
        .example-tab:hover {{ background: #bdc3c7; color: white; }}
        .example-tab.active {{ background: #3498db; color: white; }}
        .example-content {{ display: none; background: #2c3e50; color: #ecf0f1; padding: 20px; border-radius: 10px; overflow-x: auto; }}
        .example-content.active {{ display: block; }}
        .example-content pre {{ margin: 0; white-space: pre-wrap; font-family: 'Monaco', 'Consolas', monospace; font-size: 14px; }}
        .method-get {{ color: #27ae60; }}
        .method-post {{ color: #3498db; }}
        .method-put {{ color: #f39c12; }}
        .method-delete {{ color: #e74c3c; }}
        .stats {{ margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px; text-align: center; }}
        .sidebar {{ position: fixed; right: 20px; top: 20px; width: 200px; background: #2c3e50; color: white; padding: 20px; border-radius: 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Zenith API Documentation</h1>
            <p>Financial Intelligence Platform - REST API Reference</p>
        </div>

        <div class="search-box">
            <input type="text" placeholder="🔍 Search endpoints..." id="searchInput" />
        </div>

        <div class="api-grid" id="apiGrid">
            {generate_endpoint_cards(endpoints)}
        </div>

        <div class="stats">
            <p><strong>{sum(len(category) for category in endpoints.values())}</strong> endpoints documented</p>
            <p><strong>{len(endpoints)}</strong> API categories</p>
            <p>Interactive examples • Live testing • Multiple languages</p>
        </div>
    </div>

    <div class="sidebar">
        <h3>🔗 Quick Links</h3>
        <a href="#authentication" style="color: #ecf0f1; text-decoration: none; display: block; margin: 10px 0;">🔐 Authentication</a>
        <a href="#projects" style="color: #ecf0f1; text-decoration: none; display: block; margin: 10px 0;">📁 Projects</a>
        <a href="#users" style="color: #ecf0f1; text-decoration: none; display: block; margin: 10px 0;">👥 Users</a>
        <a href="#forensics" style="color: #ecf0f1; text-decoration: none; display: block; margin: 10px 0;">🔬 Forensics</a>
        <a href="#system" style="color: #ecf0f1; text-decoration: none; display: block; margin: 10px 0;">⚙️ System</a>
    </div>

    <script>
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', function(e) {{
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.category-card');
            
            cards.forEach(card => {{
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(searchTerm) ? 'block' : 'none';
            }});
        }});

        // Tab switching functionality
        function showTab(tabName, endpointId) {{
            // Hide all tabs and contents for this endpoint
            const tabs = document.querySelectorAll(`[data-endpoint="${{endpointId}}"] .example-tab`);
            const contents = document.querySelectorAll(`[data-endpoint="${{endpointId}}"] .example-content`);
            
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            // Show selected tab and content
            document.getElementById(`${{tabName}}_${{endpointId}}`).classList.add('active');
            document.getElementById(`${{tabName}}_content_${{endpointId}}`).classList.add('active');
        }}
        
        // Initialize all tabs
        document.querySelectorAll('.example-tab').forEach(tab => {{
            tab.addEventListener('click', function(e) {{
                const tabName = e.target.getAttribute('data-tab');
                const endpointId = e.target.getAttribute('data-endpoint');
                showTab(tabName, endpointId);
            }});
        }});

        // Show first tab by default
        document.querySelectorAll('.category-card').forEach(card => {{
            const firstTab = card.querySelector('.example-tab');
            const firstContent = card.querySelector('.example-content');
            if (firstTab && firstContent) {{
                firstTab.classList.add('active');
                firstContent.classList.add('active');
            }}
        }});
    </script>
</body>
</html>
    '''
    
    return html_content

def generate_endpoint_cards(endpoints) -> str:
    """Generate HTML for API endpoint cards"""
    cards = []
    
    category_icons = {
        "Authentication": "🔐",
        "Projects": "📁", 
        "Users": "👥",
        "Forensics": "🔬",
        "System": "⚙️"
    }
    
    for category_name, endpoints_data in endpoints.items():
        icon = category_icons.get(category_name, "📋")
        
        endpoints_html = ""
        for endpoint_path, endpoint_data in endpoints_data.items():
            method = endpoint_path.split()[0]
            examples = endpoint_data.get("examples", {})
            
            examples_html = ""
            if examples:
                tabs = []
                contents = []
                
                for i, (lang, code) in enumerate(examples.items()):
                    tab_name = f"tab_{i}"
                    display_name = lang.title()
                    
                    tabs.append(f'''
                    <div class="example-tab" data-tab="{tab_name}" data-endpoint="{endpoint_path.replace(' ', '_').replace('/', '_')}">
                        {display_name}
                    </div>
                    ''')
                    
                    contents.append(f'''
                    <div class="example-content" id="{tab_name}_content_{endpoint_path.replace(' ', '_').replace('/', '_')}">
                        <pre><code>{code}</code></pre>
                    </div>
                    ''')
                
                if tabs:
                    examples_html = f'''
                    <div class="examples">
                        <div class="example-tabs">
                            {''.join(tabs)}
                        </div>
                        {''.join(contents)}
                    </div>
                    '''
            
            endpoints_html += f'''
            <div class="endpoint">
                <span class="endpoint-method method-{method.lower()}">{method}</span>
                <span class="endpoint-path">{endpoint_path}</span>
            </div>
            <div class="endpoint-description">{endpoint_data.get('description', '')}</div>
            {examples_html}
            '''
        
        card = f'''
        <div class="category-card" id="{category_name.lower()}">
            <div class="category-title">
                <span class="category-icon">{icon}</span>
                {category_name}
            </div>
            {endpoints_html}
        </div>
        '''
        cards.append(card)
    
    return ''.join(cards)

def generate_postman_collection(endpoints) -> dict:
    """Generate Postman collection"""
    collection = {
        "info": {
            "name": "Zenith API",
            "description": "Zenith Financial Intelligence Platform API Collection",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        "variable": [
            {
                "key": "baseUrl",
                "value": "http://localhost:8200",
                "type": "string"
            },
            {
                "key": "jwtToken", 
                "value": "{{jwt_token}}",
                "type": "string"
            }
        ],
        "item": []
    }
    
    for category_name, endpoints_data in endpoints.items():
        for endpoint_path, endpoint_data in endpoints_data.items():
            method = endpoint_path.split()[0]
            path = endpoint_path
            
            item = {
                "name": f"{method} {path}",
                "request": {
                    "method": method,
                    "header": [
                        {
                            "key": "Content-Type",
                            "value": "application/json"
                        },
                        {
                            "key": "Authorization",
                            "value": "Bearer {{jwt_token}}"
                        }
                    ],
                    "url": {
                        "raw": "{{baseUrl}}{path}"
                    }
                }
            }
            
            # Add body if POST/PUT
            if method in ["POST", "PUT"] and "examples" in endpoint_data:
                curl_example = endpoint_data["examples"].get("curl", "")
                if "json" in curl_example:
                    # Extract JSON from curl example
                    import re
                    match = re.search(r'-d \'([^\']+)\'', curl_example)
                    if match:
                        try:
                            json_data = json.loads(match.group(1))
                            item["request"]["body"] = {
                                "mode": "raw",
                                "raw": json.dumps(json_data, indent=2),
                                "options": {
                                    "raw": {
                                        "language": "json"
                                    }
                                }
                            }
                        except Exception:
                            pass
            
            collection["item"].append(item)
    
    return collection

def generate_openapi_spec(endpoints) -> dict:
    """Generate OpenAPI 3.0 specification"""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "Zenith API",
            "description": "Financial Intelligence Platform REST API",
            "version": "1.0.0",
            "contact": {
                "name": "Zenith API Support",
                "email": "api-support@zenith.local"
            }
        },
        "servers": [
            {
                "url": "http://localhost:8200",
                "description": "Development server"
            }
        ],
        "paths": {},
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            }
        },
        "security": [
            {
                "bearerAuth": []
            }
        ]
    }
    
    for category_name, endpoints_data in endpoints.items():
        for endpoint_path, endpoint_data in endpoints_data.items():
            method = endpoint_path.split()[0].lower()
            path = endpoint_path.split()[1]
            
            if path not in spec["paths"]:
                spec["paths"][path] = {}
            
            spec["paths"][path][method] = {
                "summary": endpoint_data.get("description", ""),
                "description": endpoint_data.get("description", ""),
                "parameters": [],
                "responses": {
                    "200": {
                        "description": "Successful response"
                    }
                }
            }
            
            # Add parameters if specified
            if "parameters" in endpoint_data:
                for param_name, param_data in endpoint_data["parameters"].items():
                    spec["paths"][path][method]["parameters"].append({
                        "name": param_name,
                        "in": "query" if method in ["get"] else "json",
                        "required": param_data.get("required", False),
                        "schema": {
                            "type": param_data.get("type", "string"),
                            "example": param_data.get("example")
                        },
                        "description": param_data.get("description", param_name)
                    })
    
    return spec

def generate_comprehensive_readme(endpoints) -> str:
    """Generate comprehensive README documentation"""
    return f'''
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

{{
    "email": "user@example.com",
    "username": "newuser", 
    "password": "password123",
    "full_name": "New User"
}}
```

## 📁 Projects

### List Projects
```bash
curl -X GET http://localhost:8200/api/v1/projects \\
  -H "Authorization: Bearer <your-jwt-token>"
```

### Create Project
```bash
curl -X POST http://localhost:8200/api/v1/projects \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{{
    "name": "New Investigation",
    "description": "Financial investigation case"
  }}'
```

## 👥 Users

### List Users (Admin Only)
```bash
curl -X GET http://localhost:8200/api/v1/users \\
  -H "Authorization: Bearer <your-jwt-token>"
```

## 🔬 Forensics

### Get Forensic Data
```bash
curl -X GET "http://localhost:8200/api/v1/forensics?project_id=123" \\
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

*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
    '''

if __name__ == "__main__":
    generate_standalone_docs()