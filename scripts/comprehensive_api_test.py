
#!/usr/bin/env python3
# Comprehensive API testing

import requests
import json
import time

class APITester:
    def __init__(self):
        self.base_url = "http://localhost:8200"
        self.token = None
        self.results = []
    
    def authenticate(self):
        print("🔐 Authenticating...")
        response = requests.post(f"{self.base_url}/api/v1/auth/login", 
                              data={"username": "admin", "password": "admin123"})
        if response.status_code == 200:
            self.token = response.json()["access_token"]
            print("✅ Authentication successful")
            return True
        else:
            print("❌ Authentication failed")
            return False
    
    def test_health(self):
        print("🏥 Testing health endpoint...")
        start = time.time()
        response = requests.get(f"{self.base_url}/health")
        elapsed = time.time() - start
        result = {
            "endpoint": "/health",
            "status": response.status_code,
            "response_time": elapsed,
            "success": response.status_code == 200
        }
        self.results.append(result)
        print(f"{'✅' if result['success'] else '❌'} /health - {response.status_code} ({elapsed:.3f}s)")
        return result
    
    def test_projects(self):
        print("📁 Testing projects endpoints...")
        headers = {"Authorization": f"Bearer {self.token}"} if self.token else {}
        
        # List projects
        start = time.time()
        response = requests.get(f"{self.base_url}/api/v1/projects", headers=headers)
        elapsed = time.time() - start
        result = {
            "endpoint": "/api/v1/projects (GET)",
            "status": response.status_code,
            "response_time": elapsed,
            "success": response.status_code == 200
        }
        self.results.append(result)
        print(f"{'✅' if result['success'] else '❌'} GET /api/v1/projects - {response.status_code} ({elapsed:.3f}s)")
        
        # Create project
        project_data = {
            "name": "API Test Project",
            "description": "Automated test project"
        }
        start = time.time()
        response = requests.post(f"{self.base_url}/api/v1/projects", 
                               json=project_data, headers=headers)
        elapsed = time.time() - start
        result = {
            "endpoint": "/api/v1/projects (POST)",
            "status": response.status_code,
            "response_time": elapsed,
            "success": response.status_code in [200, 201]
        }
        self.results.append(result)
        print(f"{'✅' if result['success'] else '❌'} POST /api/v1/projects - {response.status_code} ({elapsed:.3f}s)")
        
        return result
    
    def run_all_tests(self):
        if not self.authenticate():
            return
        
        self.test_health()
        self.test_projects()
        
        self.generate_report()
    
    def generate_report(self):
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r["success"])
        avg_response_time = sum(r["response_time"] for r in self.results) / total_tests
        
        print("\n" + "="*50)
        print("📊 API TEST REPORT")
        print("="*50)
        print(f"Total Tests: {total_tests}")
        print(f"Successful: {successful_tests}")
        print(f"Success Rate: {(successful_tests/total_tests)*100:.1f}%")
        print(f"Average Response Time: {avg_response_time:.3f}s")
        
        with open("api_test_results.json", "w") as f:
            json.dump({
                "summary": {
                    "total_tests": total_tests,
                    "successful_tests": successful_tests,
                    "success_rate": (successful_tests/total_tests)*100,
                    "avg_response_time": avg_response_time
                },
                "results": self.results
            }, f, indent=2)
        
        print("\n📄 Detailed report saved to api_test_results.json")

if __name__ == "__main__":
    tester = APITester()
    tester.run_all_tests()
        