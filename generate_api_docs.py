#!/usr/bin/env python3
"""
API Documentation Generation Script
Generates comprehensive API documentation and exports in multiple formats
"""

import sys
from pathlib import Path
project_root = Path(__file__).parent
sys.path.append(str(project_root))
sys.path.append(str(project_root / "backend"))

import os
import json

from backend.app.core.api_documentation import APIDocumentationGenerator
from backend.app.main import app

def generate_all_documentation():
    """Generate all documentation formats"""
    
    # Instantiate the documentation generator
    api_docs = APIDocumentationGenerator(app)
    
    print("🚀 Generating Zenith API Documentation...")
    
    # Generate interactive HTML docs
    print("📝 Generating interactive HTML documentation...")
    html_docs = api_docs.generate_interactive_docs()
    with open("docs/api_interactive.html", "w", encoding="utf-8") as f:
        f.write(html_docs)
    print("✅ Interactive docs saved to docs/api_interactive.html")
    
    # Generate OpenAPI spec
    print("📋 Generating OpenAPI specification...")
    openapi_spec = api_docs.generate_openapi_spec()
    with open("docs/openapi.json", "w", encoding="utf-8") as f:
        json.dump(openapi_spec, f, indent=2, default=str)
    print("✅ OpenAPI spec saved to docs/openapi.json")
    
    # Generate Postman collection
    print("📮 Generating Postman collection...")
    postman_collection = api_docs.export_postman_collection()
    with open("docs/postman_collection.json", "w", encoding="utf-8") as f:
        json.dump(postman_collection, f, indent=2)
    print("✅ Postman collection saved to docs/postman_collection.json")
    
    # Generate Python SDK docs
    print("🐍 Generating Python SDK documentation...")
    python_sdk = api_docs.generate_sdk_documentation("python")
    with open("docs/python_sdk.md", "w", encoding="utf-8") as f:
        f.write(python_sdk)
    print("✅ Python SDK docs saved to docs/python_sdk.md")
    
    # Generate JavaScript SDK docs
    print("🌟 Generating JavaScript SDK documentation...")
    js_sdk = api_docs.generate_sdk_documentation("javascript")
    with open("docs/javascript_sdk.md", "w", encoding="utf-8") as f:
        f.write(js_sdk)
    print("✅ JavaScript SDK docs saved to docs/javascript_sdk.md")
    
    # Generate API testing script
    print("🧪 Generating API testing script...")
    test_script = generate_api_test_script()
    with open("scripts/test_api_examples.py", "w", encoding="utf-8") as f:
        f.write(test_script)
    print("✅ API test script saved to scripts/test_api_examples.py")
    
    # Create documentation index
    print("📚 Creating documentation index...")
    index_content = generate_docs_index()
    with open("docs/README.md", "w", encoding="utf-8") as f:
        f.write(index_content)
    print("✅ Documentation index saved to docs/README.md")
    
    print("\n🎉 All documentation generated successfully!")
    print("\n📁 Generated Files:")
    print("  • docs/api_interactive.html - Interactive API documentation")
    print("  • docs/openapi.json - OpenAPI 3.0 specification")
    print("  • docs/postman_collection.json - Postman import collection")
    print("  • docs/python_sdk.md - Python SDK documentation")
    print("  • docs/javascript_sdk.md - JavaScript SDK documentation")
    print("  • scripts/test_api_examples.py - API testing script")
    print("  • docs/README.md - Documentation index")
    
    print("\n🚀 Next Steps:")
    print("  1. Open docs/api_interactive.html in your browser")
    print("  2. Import docs/postman_collection.json into Postman")
    print("  3. Run scripts/test_api_examples.py for automated testing")
    print("  4. Review SDK documentation for client integration")

def generate_api_test_script() -> str:
    """Generate automated API testing script"""
    return '''
#!/usr/bin/env python3
"""
Automated API Testing Script
Tests all API endpoints with generated examples
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime

class APITester:
    def __init__(self):
        self.base_url = "http://localhost:8200"
        self.results = []
        self.auth_token = None
    
    async def authenticate(self):
        """Authenticate with the API"""
        async with aiohttp.ClientSession() as session:
            auth_data = {
                "username": "admin",
                "password": "admin123"
            }
            
            async with session.post(f"{self.base_url}/api/v1/auth/login", 
                                 data=auth_data) as response:
                if response.status == 200:
                    result = await response.json()
                    self.auth_token = result.get("access_token")
                    print("✅ Authentication successful")
                    return True
                else:
                    print(f"❌ Authentication failed: {response.status}")
                    return False
    
    async def test_endpoint(self, method, path, data=None, headers=None):
        """Test a single endpoint"""
        url = f"{self.base_url}{path}"
        
        if not headers:
            headers = {}
        
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        start_time = time.time()
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.request(method, url, json=data, headers=headers) as response:
                    response_time = time.time() - start_time
                    response_text = await response.text()
                    
                    result = {
                        "method": method,
                        "path": path,
                        "status_code": response.status,
                        "response_time": response_time,
                        "success": 200 <= response.status < 300,
                        "response_length": len(response_text),
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    status_icon = "✅" if result["success"] else "❌"
                    print(f"{status_icon} {method} {path} - {response.status} ({response_time:.3f}s)")
                    
                    self.results.append(result)
                    return result
                    
        except Exception as e:
            result = {
                "method": method,
                "path": path,
                "status_code": 0,
                "response_time": time.time() - start_time,
                "success": False,
                "error": str(e),
                "timestamp": datetime.now().isoformat()
            }
            
            print(f"❌ {method} {path} - ERROR: {e}")
            self.results.append(result)
            return result
    
    async def run_tests(self):
        """Run all API tests"""
        print("🧪 Starting API Testing...")
        
        # Authenticate first
        if not await self.authenticate():
            print("❌ Cannot run tests without authentication")
            return
        
        # Test endpoints
        test_cases = [
            ("GET", "/health"),
            ("GET", "/api/v1/projects"),
            ("POST", "/api/v1/projects", {
                "name": "Test Project",
                "description": "Automated test project"
            }),
            ("GET", "/api/v1/users"),
            ("GET", "/api/v1/forensics"),
            ("GET", "/api/v2/reasoning"),
            ("GET", "/api/v2/graph")
        ]
        
        print(f"\\n📋 Testing {len(test_cases)} endpoints...")
        
        for method, path, *data in test_cases:
            await self.test_endpoint(method, path, data[0] if data else None)
        
        # Generate report
        self.generate_report()
    
    def generate_report(self):
        """Generate test report"""
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r["success"])
        failed_tests = total_tests - successful_tests
        
        avg_response_time = sum(r["response_time"] for r in self.results) / total_tests
        
        print("\\n" + "="*50)
        print("📊 TEST REPORT")
        print("="*50)
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        print(f"Average Response Time: {avg_response_time:.3f}s")
        
        # Save detailed report
        report = {
            "summary": {
                "total_tests": total_tests,
                "successful_tests": successful_tests,
                "failed_tests": failed_tests,
                "success_rate": (successful_tests/total_tests)*100,
                "average_response_time": avg_response_time
            },
            "results": self.results
        }
        
        with open("api_test_results.json", "w") as f:
            json.dump(report, f, indent=2)
        
        print("\\n📄 Detailed report saved to api_test_results.json")

async def main():
    tester = APITester()
    await tester.run_tests()

if __name__ == "__main__":
    asyncio.run(main())
    '''

def generate_docs_index() -> str:
    """Generate documentation index"""
    return '''
# 📚 Zenith API Documentation

## Overview
This directory contains comprehensive documentation for the Zenith Financial Intelligence Platform API.

## 📋 Documentation Files

### Interactive Documentation
- **[api_interactive.html](./api_interactive.html)** - Interactive API documentation with live testing
  - Built-in code examples in multiple languages
  - Real-time API testing capabilities
  - Automatic request/response formatting

### API Specifications
- **[openapi.json](./openapi.json)** - Complete OpenAPI 3.0 specification
  - Machine-readable API specification
  - Compatible with Swagger UI, Redoc, and other OpenAPI tools
  - Includes all schemas, parameters, and examples

### Client Integrations
- **[postman_collection.json](./postman_collection.json)** - Postman import collection
  - Pre-configured API requests
  - Environment variable support
  - One-click import into Postman

### SDK Documentation
- **[python_sdk.md](./python_sdk.md)** - Python SDK documentation and examples
- **[javascript_sdk.md](./javascript_sdk.md)** - JavaScript SDK documentation and examples

## 🚀 Quick Start

### 1. Interactive Documentation
Open [api_interactive.html](./api_interactive.html) in your browser for the best experience:
```bash
open docs/api_interactive.html
```

### 2. Import to Postman
```bash
# Import the collection into Postman
postman collection import docs/postman_collection.json
```

### 3. Use with API Tools
```bash
# Use with Swagger UI
swagger-ui-cli -u docs/openapi.json

# Use with Redoc
redoc-cli serve docs/openapi.json
```

### 4. Automated Testing
Run the API testing script to verify all endpoints:
```bash
python scripts/test_api_examples.py
```

## 📖 API Categories

### Authentication
- JWT-based authentication
- Bearer token support
- Session management

### Core Resources
- **Projects**: Financial investigation projects
- **Users**: User management and permissions
- **Transactions**: Financial transaction data
- **Entities**: Entity relationship management

### Forensic Tools
- **Timeline**: Investigation chronology
- **Analysis**: AML and fraud detection
- **Graph**: Network and relationship visualization
- **Reasoning**: AI-powered insights

### System Operations
- **Health**: System health checks
- **Monitoring**: Performance and availability metrics
- **Audit**: Comprehensive audit logging

## 🔧 Development Tools

### Code Generation
- Auto-generated client SDKs
- Type definitions for TypeScript
- Request/response models

### Testing
- Automated API testing script
- Postman collection for manual testing
- Example code in multiple languages

### Documentation
- Interactive HTML documentation
- Machine-readable OpenAPI spec
- Comprehensive examples and tutorials

## 📞 Support

For API support and questions:
- 📧 Email: api-support@zenith.local
- 📚 Documentation: [Interactive Docs](./api_interactive.html)
- 🐛 Issue Reporting: [GitHub Issues](https://github.com/zenith/api/issues)

---

*Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*
    '''

if __name__ == "__main__":
    # Create docs directory
    os.makedirs("docs", exist_ok=True)
    os.makedirs("scripts", exist_ok=True)
    
    # Generate all documentation
    generate_all_documentation()