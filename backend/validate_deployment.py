#!/usr/bin/env python3
"""
Deployment Validation Script
Validates all system components after deployment.
"""

import asyncio
import httpx
import sys
import time
from typing import Dict, Any, List
from tabulate import tabulate


class DeploymentValidator:
    """Validates deployment readiness"""
    
    def __init__(self, api_url: str = "http://localhost:8200"):
        self.api_url = api_url
        self.results: List[Dict[str, Any]] = []
        self.client = None
    
    async def run_all_validations(self):
        """Run all validation checks"""
        print("=" * 80)
        print("ZENITH PLATFORM - DEPLOYMENT VALIDATION")
        print("=" * 80)
        print(f"\nTarget: {self.api_url}")
        print(f"Time: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            self.client = client
            
            # Run all checks
            await self.check_health()
            await self.check_detailed_health()
            await self.check_metrics()
            await self.check_cors()
            await self.check_rate_limiting()
            await self.check_auth_endpoints()
            await self.check_api_docs()
        
        # Print results
        self.print_results()
    
    async def check_health(self):
        """Basic health check"""
        try:
            response = await self.client.get(f"{self.api_url}/health")
            
            if response.status_code == 200:
                data = response.json()
                self.results.append({
                    "check": "Basic Health",
                    "status": "✅ PASS",
                    "details": f"Status: {data.get('status', 'unknown')}"
                })
            else:
                self.results.append({
                    "check": "Basic Health",
                    "status": "❌ FAIL",
                    "details": f"HTTP {response.status_code}"
                })
        except Exception as e:
            self.results.append({
                "check": "Basic Health",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_detailed_health(self):
        """Detailed health check"""
        try:
            response = await self.client.get(f"{self.api_url}/health/detailed")
            
            if response.status_code == 200:
                data = response.json()
                overall = data.get("overall_status", "unknown")
                components = data.get("components", {})
                
                all_healthy = all(
                    c.get("status") in ["healthy", "configured"]
                    for c in components.values()
                )
                
                if all_healthy and overall == "healthy":
                    status = "✅ PASS"
                    details = f"All {len(components)} components healthy"
                else:
                    status = "⚠️  WARN"
                    unhealthy = [
                        name for name, comp in components.items()
                        if comp.get("status") not in ["healthy", "configured"]
                    ]
                    details = f"Issues: {', '.join(unhealthy)}"
                
                # Add cache hit rate if available
                redis_metrics = components.get("redis", {}).get("metrics", {})
                if "cache_hit_rate_percent" in redis_metrics:
                    hit_rate = redis_metrics["cache_hit_rate_percent"]
                    details += f" | Cache: {hit_rate}%"
                
                self.results.append({
                    "check": "Detailed Health",
                    "status": status,
                    "details": details
                })
            else:
                self.results.append({
                    "check": "Detailed Health",
                    "status": "❌ FAIL",
                    "details": f"HTTP {response.status_code}"
                })
        except Exception as e:
            self.results.append({
                "check": "Detailed Health",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_metrics(self):
        """Prometheus metrics endpoint"""
        try:
            response = await self.client.get(f"{self.api_url}/metrics")
            
            if response.status_code == 200:
                text = response.text
                metric_count = len([l for l in text.split("\n") if l and not l.startswith("#")])
                
                self.results.append({
                    "check": "Metrics Endpoint",
                    "status": "✅ PASS",
                    "details": f"{metric_count} metrics exported"
                })
            else:
                self.results.append({
                    "check": "Metrics Endpoint",
                    "status": "❌ FAIL",
                    "details": f"HTTP {response.status_code}"
                })
        except Exception as e:
            self.results.append({
                "check": "Metrics Endpoint",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_cors(self):
        """CORS headers check"""
        try:
            response = await self.client.options(
                f"{self.api_url}/health",
                headers={"Origin": "http://localhost:3000"}
            )
            
            cors_header = response.headers.get("access-control-allow-origin")
            
            if cors_header:
                self.results.append({
                    "check": "CORS Headers",
                    "status": "✅ PASS",
                    "details": f"Origin: {cors_header}"
                })
            else:
                self.results.append({
                    "check": "CORS Headers",
                    "status": "⚠️  WARN",
                    "details": "No CORS headers found"
                })
        except Exception as e:
            self.results.append({
                "check": "CORS Headers",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_rate_limiting(self):
        """Rate limiting functionality"""
        try:
            # Make 3 rapid requests
            responses = []
            for _ in range(3):
                r = await self.client.get(f"{self.api_url}/health")
                responses.append(r.status_code)
            
            # Check for rate limit headers
            last_response = await self.client.get(f"{self.api_url}/health")
            has_rate_headers = "x-ratelimit-limit" in last_response.headers or \
                              "retry-after" in last_response.headers
            
            if all(s == 200 for s in responses):
                status = "✅ PASS" if has_rate_headers else "⚠️  WARN"
                details = "Active" if has_rate_headers else "Headers missing"
                self.results.append({
                    "check": "Rate Limiting",
                    "status": status,
                    "details": details
                })
            else:
                self.results.append({
                    "check": "Rate Limiting",
                    "status": "❌ FAIL",
                    "details": "Unexpected responses"
                })
        except Exception as e:
            self.results.append({
                "check": "Rate Limiting",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_auth_endpoints(self):
        """Authentication endpoints"""
        try:
            response = await self.client.get(f"{self.api_url}/api/v1/project")
            
            # Should return 401 or 403 without auth
            if response.status_code in [401, 403]:
                self.results.append({
                    "check": "Authentication",
                    "status": "✅ PASS",
                    "details": "Endpoints protected"
                })
            elif response.status_code == 200:
                self.results.append({
                    "check": "Authentication",
                    "status": "⚠️  WARN",
                    "details": "No auth required (dev mode?)"
                })
            else:
                self.results.append({
                    "check": "Authentication",
                    "status": "❌ FAIL",
                    "details": f"HTTP {response.status_code}"
                })
        except Exception as e:
            self.results.append({
                "check": "Authentication",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    async def check_api_docs(self):
        """API documentation availability"""
        try:
            response = await self.client.get(f"{self.api_url}/docs")
            
            if response.status_code == 200:
                self.results.append({
                    "check": "API Docs",
                    "status": "✅ PASS",
                    "details": "Swagger UI available"
                })
            else:
                self.results.append({
                    "check": "API Docs",
                    "status": "⚠️  WARN",
                    "details": f"HTTP {response.status_code}"
                })
        except Exception as e:
            self.results.append({
                "check": "API Docs",
                "status": "❌ FAIL",
                "details": str(e)
            })
    
    def print_results(self):
        """Print validation results"""
        print("\n" + "=" * 80)
        print("VALIDATION RESULTS")
        print("=" * 80 + "\n")
        
        table_data = [
            [r["check"], r["status"], r["details"]]
            for r in self.results
        ]
        
        print(tabulate(
            table_data,
            headers=["Check", "Status", "Details"],
            tablefmt="grid"
        ))
        
        # Summary
        passed = sum(1 for r in self.results if "✅" in r["status"])
        warned = sum(1 for r in self.results if "⚠️" in r["status"])
        failed = sum(1 for r in self.results if "❌" in r["status"])
        total = len(self.results)
        
        print("\n" + "=" * 80)
        print(f"Summary: {passed}/{total} passed, {warned} warnings, {failed} failed")
        print("=" * 80)
        
        if failed > 0:
            print("\n❌ DEPLOYMENT VALIDATION FAILED")
            print("Fix the failed checks before deploying to production.")
            sys.exit(1)
        elif warned > 0:
            print("\n⚠️  DEPLOYMENT VALIDATION PASSED WITH WARNINGS")
            print("Review warnings before deploying to production.")
            sys.exit(0)
        else:
            print("\n✅ DEPLOYMENT VALIDATION PASSED")
            print("All checks passed. Ready for production deployment!")
            sys.exit(0)


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Validate Zenith deployment")
    parser.add_argument(
        "--url",
        default="http://localhost:8200",
        help="API URL to validate (default: http://localhost:8200)"
    )
    args = parser.parse_args()
    
    validator = DeploymentValidator(api_url=args.url)
    await validator.run_all_validations()


if __name__ == "__main__":
    asyncio.run(main())
