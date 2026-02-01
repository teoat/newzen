"""
Enhanced API Documentation Generator
Creates comprehensive, interactive API documentation with examples
"""

import json
import inspect
from typing import Dict, List, Any, Optional, Type
from datetime import datetime
from fastapi import FastAPI
from fastapi.routing import APIRoute

class APIDocumentationGenerator:
    """
    Generates comprehensive API documentation with examples and testing capabilities
    """
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.endpoints = []
        self.models = {}
        self.examples = {}
        self._extract_endpoints()
        self._generate_examples()
    
    def _extract_endpoints(self):
        """Extract all endpoints from FastAPI app"""
        for route in self.app.routes:
            if isinstance(route, APIRoute):
                endpoint_info = {
                    'path': route.path,
                    'method': route.methods,
                    'name': route.name,
                    'summary': getattr(route, 'summary', ''),
                    'description': getattr(route, 'description', ''),
                    'tags': getattr(route, 'tags', []),
                    'parameters': self._extract_parameters(route),
                    'responses': self._extract_responses(route),
                    'body': self._extract_body_schema(route),
                    'security': getattr(route, 'dependencies', [])
                }
                self.endpoints.append(endpoint_info)
    
    def _extract_parameters(self, route) -> List[Dict[str, Any]]:
        """Extract parameters from route"""
        parameters = []
        
        if hasattr(route, 'dependant'):
            # Extract from dependency injection
            for dependency in route.dependant.dependencies:
                if hasattr(dependency, 'call') and hasattr(dependency.call, '__code__'):
                    # Parse function parameters
                    sig = inspect.signature(dependency.call)
                    for param_name, param in sig.parameters.items():
                        if param_name not in ['self', 'request', 'db']:
                            param_info = {
                                'name': param_name,
                                'type': self._get_type_string(param.annotation),
                                'required': param.default == inspect.Parameter.empty,
                                'description': f"Parameter: {param_name}",
                                'example': self._generate_example_for_type(param.annotation)
                            }
                            parameters.append(param_info)
        
        return parameters
    
    def _extract_responses(self, route) -> Dict[int, Dict[str, Any]]:
        """Extract response schemas from route"""
        responses = {}
        
        # Try to get response models from route endpoint
        if hasattr(route, 'endpoint'):
            try:
                sig = inspect.signature(route.endpoint)
                return_annotation = sig.return_annotation
                
                # Extract response models from return annotation
                if hasattr(return_annotation, '__origin__'):
                    # For Union types
                    responses[200] = {
                        'description': 'Successful response',
                        'content': {
                            'application/json': {
                                'schema': self._model_to_schema(return_annotation)
                            }
                        }
                    }
                elif return_annotation != inspect.Signature.empty:
                    responses[200] = {
                        'description': 'Successful response',
                        'content': {
                            'application/json': {
                                'schema': self._model_to_schema(return_annotation)
                            }
                        }
                    }
                
            except Exception as e:
                print(f"Error extracting responses: {e}")
        
        # Default responses
        responses.setdefault(200, {'description': 'Successful response'})
        responses[400] = {'description': 'Bad Request'}
        responses[401] = {'description': 'Unauthorized'}
        responses[403] = {'description': 'Forbidden'}
        responses[404] = {'description': 'Not Found'}
        responses[422] = {'description': 'Validation Error'}
        responses[500] = {'description': 'Internal Server Error'}
        
        return responses
    
    def _extract_body_schema(self, route) -> Optional[Dict[str, Any]]:
        """Extract request body schema from route"""
        if hasattr(route, 'endpoint'):
            try:
                sig = inspect.signature(route.endpoint)
                for param_name, param in sig.parameters.items():
                    if param_name in ['body', 'item', 'data'] and param.annotation != inspect.Parameter.empty:
                        return {
                            'content': {
                                'application/json': {
                                    'schema': self._model_to_schema(param.annotation)
                                }
                            },
                            'required': True,
                            'description': f"Request body: {param_name}"
                        }
            except Exception:
                pass
        
        return None
    
    def _model_to_schema(self, model_type: Type) -> Dict[str, Any]:
        """Convert Pydantic model to JSON schema"""
        try:
            if hasattr(model_type, 'model_json_schema'):
                return model_type.model_json_schema()
            elif hasattr(model_type, '__origin__'):
                # Handle Union, List, Dict types
                return {
                    'type': self._get_type_string(model_type)
                }
            else:
                return {
                    'type': self._get_type_string(model_type)
                }
        except Exception as e:
            return {'type': 'unknown', 'error': str(e)}
    
    def _get_type_string(self, type_annotation: Type) -> str:
        """Get string representation of type annotation"""
        try:
            if hasattr(type_annotation, '__name__'):
                return type_annotation.__name__
            elif str(type_annotation).startswith('typing.'):
                return str(type_annotation).replace('typing.', '')
            else:
                return str(type_annotation)
        except Exception:
            return 'unknown'
    
    def _generate_example_for_type(self, type_annotation: Type) -> Any:
        """Generate example value for type"""
        type_str = self._get_type_string(type_annotation).lower()
        
        if 'str' in type_str:
            return "example_string"
        elif 'int' in type_str:
            return 42
        elif 'float' in type_str or 'decimal' in type_str:
            return 3.14
        elif 'bool' in type_str:
            return True
        elif 'list' in type_str:
            return [1, 2, 3]
        elif 'dict' in type_str:
            return {"key": "value"}
        elif 'datetime' in type_str:
            return datetime.now().isoformat()
        else:
            return "example_value"
    
    def _generate_examples(self):
        """Generate realistic examples for each endpoint"""
        for endpoint in self.endpoints:
            endpoint['path']
            method = list(endpoint['method'])[0] if endpoint['method'] else 'GET'
            
            if method == 'GET':
                self._generate_get_example(endpoint)
            elif method == 'POST':
                self._generate_post_example(endpoint)
            elif method == 'PUT':
                self._generate_put_example(endpoint)
            elif method == 'DELETE':
                self._generate_delete_example(endpoint)
    
    def _generate_get_example(self, endpoint):
        """Generate GET request example"""
        path = endpoint['path']
        
        if 'projects' in path:
            self.examples[f"GET_{path}"] = {
                'description': "Retrieve projects list",
                'url': f"http://localhost:8200{path}",
                'method': 'GET',
                'headers': {
                    'Authorization': 'Bearer <your-jwt-token>',
                    'Content-Type': 'application/json'
                },
                'curl_example': f"curl -X GET http://localhost:8200{path} -H 'Authorization: Bearer <your-jwt-token>'",
                'python_example': f'''
import requests

headers = {{
    "Authorization": "Bearer <your-jwt-token>",
    "Content-Type": "application/json"
}}

response = requests.get("http://localhost:8200{path}", headers=headers)
print(response.json())
''',
                'javascript_example': f'''
fetch('http://localhost:8200{path}', {{
    method: 'GET',
    headers: {{
        'Authorization': 'Bearer <your-jwt-token>',
        'Content-Type': 'application/json'
    }}
}})
.then(response => response.json())
.then(data => console.log(data));
'''
            }
        elif 'users' in path:
            self.examples[f"GET_{path}"] = {
                'description': "Retrieve users list",
                'url': f"http://localhost:8200{path}",
                'method': 'GET',
                'headers': {
                    'Authorization': 'Bearer <your-jwt-token>'
                },
                'curl_example': f"curl -X GET http://localhost:8200{path} -H 'Authorization: Bearer <your-jwt-token>'"
            }
    
    def _generate_post_example(self, endpoint):
        """Generate POST request example"""
        path = endpoint['path']
        
        if 'projects' in path:
            self.examples[f"POST_{path}"] = {
                'description': "Create a new project",
                'url': f"http://localhost:8200{path}",
                'method': 'POST',
                'headers': {
                    'Authorization': 'Bearer <your-jwt-token>',
                    'Content-Type': 'application/json'
                },
                'body': {
                    'name': 'Example Project',
                    'description': 'An example project for testing',
                    'status': 'active',
                    'metadata': {
                        'created_by': 'test_user',
                        'tags': ['example', 'test']
                    }
                },
                'curl_example': f'''
curl -X POST http://localhost:8200{path} \\
  -H 'Authorization: Bearer <your-jwt-token>' \\
  -H 'Content-Type: application/json' \\
  -d '{{
    "name": "Example Project",
    "description": "An example project for testing",
    "status": "active"
  }}'
''',
                'python_example': f'''
import requests

headers = {{
    "Authorization": "Bearer <your-jwt-token>",
    "Content-Type": "application/json"
}}

payload = {{
    "name": "Example Project",
    "description": "An example project for testing",
    "status": "active"
}}

response = requests.post("http://localhost:8200{path}", headers=headers, json=payload)
print(response.json())
'''
            }

    def _generate_put_example(self, endpoint):
        """Generate PUT request example"""
        path = endpoint['path']
        self.examples[f"PUT_{path}"] = {
            'description': f"Update resource at {path}",
            'url': f"http://localhost:8200{path}",
            'method': 'PUT',
            'headers': {
                'Authorization': 'Bearer <your-jwt-token>',
                'Content-Type': 'application/json'
            },
            'curl_example': f"curl -X PUT http://localhost:8200{path} -H 'Authorization: Bearer <your-jwt-token>' -H 'Content-Type: application/json' -d '{{}}'"
        }

    def _generate_delete_example(self, endpoint):
        """Generate DELETE request example"""
        path = endpoint['path']
        self.examples[f"DELETE_{path}"] = {
            'description': f"Delete resource at {path}",
            'url': f"http://localhost:8200{path}",
            'method': 'DELETE',
            'headers': {
                'Authorization': 'Bearer <your-jwt-token>'
            },
            'curl_example': f"curl -X DELETE http://localhost:8200{path} -H 'Authorization: Bearer <your-jwt-token>'"
        }

    def generate_openapi_spec(self) -> Dict[str, Any]:
        """Generate enhanced OpenAPI specification"""
        base_spec = self.app.openapi()
        
        # Add custom extensions
        base_spec['x-audit-logging'] = {
            'enabled': True,
            'categories': ['authentication', 'data_access', 'api_request'],
            'retention': '30 days'
        }
        
        # Add security schemes
        base_spec['components']['securitySchemes'] = {
            'bearerAuth': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT'
            }
        }
        
        # Add examples
        base_spec['components']['examples'] = self.examples
        
        return base_spec
    
    def generate_interactive_docs(self) -> str:
        """Generate interactive HTML documentation"""
        css = """
        body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .header { text-align: center; margin-bottom: 30px; }
        .api-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; }
        .endpoint-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
        .method { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; }
        .get { background: #28a745; }
        .post { background: #007bff; }
        .put { background: #ffc107; color: #000; }
        .delete { background: #dc3545; }
        .code { background: #f1f3f4; padding: 10px; border-radius: 4px; overflow-x: auto; }
        .example-tabs { margin-top: 15px; }
        .tab { border: 1px solid #ddd; background: #f1f1f1; padding: 10px 15px; cursor: pointer; }
        .tab.active { background: #007bff; color: white; }
        .tab-content { display: none; padding: 15px; background: #f8f9fa; border: 1px solid #ddd; border-top: none; }
        .tab-content.active { display: block; }
        """
        
        html_content = f'''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith API Documentation</title>
    <script src="https://cdn.jsdelivr.net/npm/redoc@2.0.0/bundles/redoc.standalone.js"></script>
    <style>
        {css}
    </style>
</head>
<body>
    <div class="header">
        <h1>Zenith Financial Intelligence API</h1>
        <p>Comprehensive REST API documentation with interactive examples</p>
    </div>

    <div class="api-grid">
        {self._generate_endpoint_cards()}
    </div>

    <script>
        // Interactive documentation functionality
        function showTab(tabName, endpointPath) {{
            const tabs = document.querySelectorAll(`.tab[data-endpoint="${{endpointPath}}"]`);
            const contents = document.querySelectorAll(`.tab-content[data-endpoint="${{endpointPath}}"]`);
            
            tabs.forEach(tab => tab.classList.remove('active'));
            contents.forEach(content => content.classList.remove('active'));
            
            const activeTab = document.querySelector(`.tab[data-tab="${{tabName}}"][data-endpoint="${{endpointPath}}"]`);
            if (activeTab) activeTab.classList.add('active');
            
            const activeContent = document.getElementById(tabName);
            if (activeContent) activeContent.classList.add('active');
        }}
        
        // Initialize tabs
        document.querySelectorAll('.tab').forEach(tab => {{
            tab.addEventListener('click', (e) => {{
                const tabName = e.target.getAttribute('data-tab');
                const endpointPath = e.target.getAttribute('data-endpoint');
                showTab(tabName, endpointPath);
            }});
        }});
    </script>
</body>
</html>
        '''
        return html_content
    
    def _generate_endpoint_cards(self) -> str:
        """Generate HTML for each endpoint"""
        cards = []
        
        for endpoint in self.endpoints:
            method = list(endpoint['method'])[0] if endpoint['method'] else 'GET'
            path = endpoint['path']
            description = endpoint.get('description', f'{method} {path}')
            
            examples = self.examples.get(f"{method}_{path}", {})
            
            card = f'''
            <div class="endpoint-card">
                <div style="display: flex; align-items: center; margin-bottom: 15px;">
                    <span class="method {method.lower()}">{method}</span>
                    <h3 style="margin: 0 0 0 10px;">{path}</h3>
                </div>
                
                <p><strong>{description}</strong></p>
                
                {self._generate_example_tabs(examples, f"{method}_{path}")}
            </div>
            '''
            cards.append(card)
        
        return ''.join(cards)
    
    def _generate_example_tabs(self, examples: Dict[str, Any], endpoint_key: str) -> str:
        """Generate tabbed example sections"""
        if not examples:
            return ''
        
        tabs = []
        contents = []
        
        for i, (example_type, example_data) in enumerate(examples.items()):
            tab_name = f"tab_{i}"
            display_name = example_type.replace('_', ' ').title()
            
            tabs.append(f'''
            <div class="tab" data-tab="{tab_name}" data-endpoint="{endpoint_key}">
                {display_name}
            </div>
            ''')
            
            content = ''
            if 'curl_example' in example_data:
                content += f'''
                <div class="code">
                    <h4>curl</h4>
                    <pre><code>{example_data['curl_example']}</code></pre>
                </div>
                '''
            
            if 'python_example' in example_data:
                content += f'''
                <div class="code">
                    <h4>Python</h4>
                    <pre><code>{example_data['python_example']}</code></pre>
                </div>
                '''
            
            if 'javascript_example' in example_data:
                content += f'''
                <div class="code">
                    <h4>JavaScript</h4>
                    <pre><code>{example_data['javascript_example']}</code></pre>
                </div>
                '''
            
            contents.append(f'''
            <div class="tab-content" id="{tab_name}" data-endpoint="{endpoint_key}">
                {content}
            </div>
            ''')
        
        return f'''
        <div class="example-tabs">
            <div style="display: flex; gap: 5px; margin-bottom: 0;">
                {''.join(tabs)}
            </div>
            {''.join(contents)}
        </div>
        ''' if tabs else ''
    
    def export_postman_collection(self) -> Dict[str, Any]:
        """Generate Postman collection"""
        collection = {
            "info": {
                "name": "Zenith API",
                "description": "Zenith Financial Intelligence API collection",
                "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
            },
            "item": []
        }
        
        for endpoint in self.endpoints:
            method = list(endpoint['method'])[0] if endpoint['method'] else 'GET'
            
            item = {
                "name": f"{method} {endpoint['path']}",
                "request": {
                    "method": method,
                    "header": [
                        {
                            "key": "Authorization",
                            "value": "Bearer <your-jwt-token>",
                            "type": "text"
                        },
                        {
                            "key": "Content-Type",
                            "value": "application/json",
                            "type": "text"
                        }
                    ],
                    "url": {
                        "raw": "http://localhost:8200{{endpoint['path']}}"
                    }
                }
            }
            
            # Add body if exists
            if endpoint['body']:
                item["request"]["body"] = {
                    "mode": "raw",
                    "raw": json.dumps({
                        "name": "Example Project",
                        "description": "An example project"
                    }, indent=2),
                    "options": {
                        "raw": {
                            "language": "json"
                        }
                    }
                }
            
            collection["item"].append(item)
        
        return collection
    
    def generate_sdk_documentation(self, language: str = "python") -> str:
        """Generate SDK documentation"""
        if language == "python":
            return self._generate_python_sdk()
        elif language == "javascript":
            return self._generate_javascript_sdk()
        else:
            return "SDK documentation not available for this language"
    
    def _generate_python_sdk(self) -> str:
        """Generate Python SDK documentation"""
        return '''
# Zenith Python SDK

## Installation
```bash
pip install zenith-client
```

## Authentication
```python
from zenith_client import ZenithClient

# Initialize client
client = ZenithClient(
    base_url="http://localhost:8200",
    api_key="your-jwt-token"
)

# Or authenticate with username/password
client.authenticate("username", "password")
```

## Projects API
```python
# List projects
projects = client.projects.list()

# Create project
project = client.projects.create({
    "name": "My Project",
    "description": "Project description"
})

# Get project
project = client.projects.get("project_id")

# Update project
updated = client.projects.update("project_id", {
    "name": "Updated Project"
})

# Delete project
client.projects.delete("project_id")
```

## Usage Examples
```python
# Working with financial data
transactions = client.transactions.list(project_id="123")
for transaction in transactions:
    print(f"Amount: ${transaction.amount}, Date: {transaction.date}")

# Forensic analysis
analysis = client.forensic.analyze_transaction(transaction_id="456")
print(f"Risk Score: {analysis.risk_score}")
```
        '''
    
    def _generate_javascript_sdk(self) -> str:
        """Generate JavaScript SDK documentation"""
        return '''
# Zenith JavaScript SDK

## Installation
```bash
npm install @zenith/client
```

## Authentication
```javascript
import { ZenithClient } from '@zenith/client';

// Initialize client
const client = new ZenithClient({
    baseURL: 'http://localhost:8200',
    apiKey: 'your-jwt-token'
});

// Or authenticate with credentials
await client.authenticate('username', 'password');
```

## Projects API
```javascript
// List projects
const projects = await client.projects.list();

// Create project
const project = await client.projects.create({
    name: 'My Project',
    description: 'Project description'
});

// Get project
const project = await client.projects.get('project_id');

// Update project
const updated = await client.projects.update('project_id', {
    name: 'Updated Project'
});

// Delete project
await client.projects.delete('project_id');
```

## Usage Examples
```javascript
// Working with financial data
const transactions = await client.transactions.list({ projectId: '123' });
for (const transaction of transactions) {
    console.log(`Amount: $${transaction.amount}, Date: ${transaction.date}`);
}

// Forensic analysis
const analysis = await client.forensic.analyzeTransaction('transactionId');
console.log(`Risk Score: ${analysis.riskScore}`);
```
        '''

# Singleton instance
api_documentation = APIDocumentationGenerator