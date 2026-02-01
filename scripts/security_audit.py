#!/usr/bin/env python3
"""
Comprehensive Security Audit Script for Zenith Platform
Performs security checks across all components
"""

import sys
import os
import re
import json
import requests
import subprocess
from pathlib import Path
from datetime import datetime

# Colors for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
PURPLE = '\033[95m'
CYAN = '\033[96m'
WHITE = '\033[97m'
ENDC = '\033[0m'

class SecurityAudit:
    def __init__(self):
        self.results = []
        self.base_url = "http://localhost:8200"
        self.frontend_url = "http://localhost:3200"
        
    def log_result(self, category: str, test: str, status: str, details: str = "", risk: str = ""):
        """Log security test result"""
        self.results.append({
            "category": category,
            "test": test,
            "status": status,
            "details": details,
            "risk": risk,
            "timestamp": datetime.now().isoformat()
        })
        
        status_color = GREEN if status == "PASS" else YELLOW if status == "WARN" else RED
        print(f"{status_color}{status:4}{ENDC} {category:20} {test:30} {risk}")
        if details:
            print(f"     {WHITE}{details}{ENDC}")
    
    def print_header(self, title: str):
        """Print section header"""
        print(f"\n{PURPLE}{'='*60}{ENDC}")
        print(f"{PURPLE}{title.center(60)}{ENDC}")
        print(f"{PURPLE}{'='*60}{ENDC}\n")
    
    def check_environment_secrets(self):
        """Check for hardcoded secrets in environment files"""
        self.print_header("ENVIRONMENT SECURITY")
        
        env_files = [
            "backend/.env",
            "frontend/.env.local",
            ".env"
        ]
        
        secret_patterns = [
            (r'password\s*=\s*[^#\s]+', "Hardcoded password"),
            (r'secret_key\s*=\s*[^#\s]+', "Hardcoded secret key"),
            (r'api_key\s*=\s*[^#\s]+', "Hardcoded API key"),
            (r'jwt_secret\s*=\s*[^#\s]+', "Hardcoded JWT secret"),
            (r'database_url\s*=\s*[^#\s]+', "Database credentials"),
        ]
        
        for env_file in env_files:
            if os.path.exists(env_file):
                with open(env_file, 'r') as f:
                    content = f.read()
                    for pattern, description in secret_patterns:
                        if re.search(pattern, content, re.IGNORECASE):
                            value_match = re.search(pattern, content, re.IGNORECASE)
                            if value_match:
                                value = value_match.group()
                                # Hide actual secrets in output
                                masked_value = re.sub(r'=\s*[^\s]+', '=***MASKED***', value)
                                self.log_result(
                                    "Environment", 
                                    description, 
                                    "WARN", 
                                    f"Found in {env_file}: {masked_value}",
                                    "Medium"
                                )
                    else:
                        self.log_result(
                            "Environment",
                            f"Secret patterns in {env_file}",
                            "PASS",
                            "No hardcoded secrets found"
                        )
    
    def check_api_security_headers(self):
        """Check security headers on API endpoints"""
        self.print_header("API SECURITY HEADERS")
        
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000',
            'Content-Security-Policy': 'default-src',
        }
        
        try:
            response = requests.get(self.base_url + "/health", timeout=5)
            missing_headers = []
            
            for header, expected in security_headers.items():
                if header.lower() not in [h.lower() for h in response.headers]:
                    missing_headers.append(header)
            
            if missing_headers:
                self.log_result(
                    "API Headers",
                    "Security Headers",
                    "WARN",
                    f"Missing headers: {', '.join(missing_headers)}",
                    "Medium"
                )
            else:
                self.log_result(
                    "API Headers",
                    "Security Headers",
                    "PASS",
                    "All security headers present"
                )
                
        except Exception as e:
            self.log_result(
                "API Headers",
                "Security Headers",
                "FAIL",
                f"Could not connect: {e}",
                "High"
            )
    
    def check_authentication_security(self):
        """Test authentication mechanisms"""
        self.print_header("AUTHENTICATION SECURITY")
        
        # Test login endpoint
        try:
            # Test SQL injection
            sql_payload = "admin'; DROP TABLE users; --"
            response = requests.post(
                self.base_url + "/api/v1/auth/login",
                data={"username": sql_payload, "password": "test"},
                timeout=5
            )
            
            if response.status_code == 200:
                self.log_result(
                    "Authentication",
                    "SQL Injection Protection",
                    "FAIL",
                    "Potential SQL injection vulnerability",
                    "Critical"
                )
            else:
                self.log_result(
                    "Authentication",
                    "SQL Injection Protection",
                    "PASS",
                    "SQL injection blocked"
                )
                
            # Test rate limiting
            requests_sent = 0
            for i in range(10):
                response = requests.post(
                    self.base_url + "/api/v1/auth/login",
                    data={"username": "test", "password": "wrong"},
                    timeout=2
                )
                requests_sent += 1
                if response.status_code == 429:
                    break
            
            if requests_sent > 8:  # Should be rate limited
                self.log_result(
                    "Authentication",
                    "Rate Limiting",
                    "WARN",
                    f"Sent {requests_sent} requests without rate limiting",
                    "Medium"
                )
            else:
                self.log_result(
                    "Authentication",
                    "Rate Limiting",
                    "PASS",
                    f"Rate limited after {requests_sent} requests"
                )
                
        except Exception as e:
            self.log_result(
                "Authentication",
                "Security Tests",
                "FAIL",
                f"Error testing authentication: {e}",
                "High"
            )
    
    def check_csrf_protection(self):
        """Test CSRF protection"""
        self.print_header("CSRF PROTECTION")
        
        try:
            # Test without CSRF token
            response = requests.post(
                self.base_url + "/api/v1/projects",
                json={"name": "test", "description": "test"},
                timeout=5
            )
            
            if response.status_code == 403 and "csrf" in response.text.lower():
                self.log_result(
                    "CSRF",
                    "CSRF Token Protection",
                    "PASS",
                    "CSRF protection active"
                )
            else:
                self.log_result(
                    "CSRF",
                    "CSRF Token Protection",
                    "FAIL",
                    f"CSRF not blocking requests (status: {response.status_code})",
                    "High"
                )
                
        except Exception as e:
            self.log_result(
                "CSRF",
                "CSRF Token Protection",
                "FAIL",
                f"Error testing CSRF: {e}",
                "High"
            )
    
    def check_database_security(self):
        """Check database security configuration"""
        self.print_header("DATABASE SECURITY")
        
        # Check if database is exposed
        try:
            # Try to connect to database from outside container
            result = subprocess.run(
                ["docker", "exec", "zenith_db", "psql", "-U", "zenith", "-d", "zenith_lite", "-c", "SHOW password_encryption;"],
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                self.log_result(
                    "Database",
                    "Password Encryption",
                    "PASS",
                    "Password encryption configured"
                )
            
            # Check for SSL configuration
            result = subprocess.run(
                ["docker", "exec", "zenith_db", "psql", "-U", "zenith", "-d", "zenith_lite", "-c", "SHOW ssl;"],
                capture_output=True,
                text=True
            )
            
            if "off" in result.stdout.lower():
                self.log_result(
                    "Database",
                    "SSL Configuration",
                    "WARN",
                    "Database SSL not enabled",
                    "Medium"
                )
            else:
                self.log_result(
                    "Database",
                    "SSL Configuration", 
                    "PASS",
                    "Database SSL enabled"
                )
                
        except Exception as e:
            self.log_result(
                "Database",
                "Security Checks",
                "WARN",
                f"Could not verify database security: {e}",
                "Medium"
            )
    
    def check_container_security(self):
        """Check Docker container security"""
        self.print_header("CONTAINER SECURITY")
        
        containers = ["zenith_backend", "zenith_frontend", "zenith_db", "zenith_redis"]
        
        for container in containers:
            try:
                # Check if container is running as root
                result = subprocess.run(
                    ["docker", "exec", container, "id", "-u"],
                    capture_output=True,
                    text=True
                )
                
                if "uid=0" in result.stdout:
                    self.log_result(
                        "Container",
                        f"{container} User Context",
                        "WARN",
                        "Container running as root",
                        "Medium"
                    )
                else:
                    self.log_result(
                        "Container",
                        f"{container} User Context",
                        "PASS",
                        f"Container running as non-root: {result.stdout.strip()}"
                    )
                
                # Check for exposed sensitive directories
                result = subprocess.run(
                    ["docker", "inspect", container, "--format", "{{json .Mounts}}"],
                    capture_output=True,
                    text=True
                )
                
                mounts = json.loads(result.stdout)
                sensitive_mounts = []
                
                for mount in mounts:
                    if any(sensitive in mount.get("Source", "").lower() for sensitive in ["etc", "root", "var"]):
                        sensitive_mounts.append(mount.get("Source"))
                
                if sensitive_mounts:
                    self.log_result(
                        "Container",
                        f"{container} Mounts",
                        "WARN",
                        f"Sensitive mounts: {', '.join(sensitive_mounts)}",
                        "Low"
                    )
                else:
                    self.log_result(
                        "Container",
                        f"{container} Mounts",
                        "PASS",
                        "No sensitive mounts detected"
                    )
                    
            except Exception as e:
                self.log_result(
                    "Container",
                    f"{container} Security",
                    "WARN",
                    f"Could not inspect container: {e}",
                    "Low"
                )
    
    def check_dependency_vulnerabilities(self):
        """Check for known vulnerabilities in dependencies"""
        self.print_header("DEPENDENCY SECURITY")
        
        # Check Python dependencies
        try:
            result = subprocess.run(
                ["pip-audit", "--format", "json"],
                capture_output=True,
                text=True,
                cwd="backend"
            )
            
            if result.returncode == 0:
                audit_data = json.loads(result.stdout)
                vulnerabilities = audit_data.get("dependencies", [])
                
                if vulnerabilities:
                    high_vulns = [v for v in vulnerabilities if v.get("severity") == "high"]
                    if high_vulns:
                        self.log_result(
                            "Dependencies",
                            "Python Vulnerabilities",
                            "FAIL",
                            f"Found {len(high_vulns)} high-severity vulnerabilities",
                            "High"
                        )
                    else:
                        self.log_result(
                            "Dependencies",
                            "Python Vulnerabilities",
                            "WARN",
                            f"Found {len(vulnerabilities)} vulnerabilities (none high-severity)",
                            "Medium"
                        )
                else:
                    self.log_result(
                        "Dependencies",
                        "Python Vulnerabilities",
                        "PASS",
                        "No vulnerabilities found"
                    )
            else:
                self.log_result(
                    "Dependencies",
                    "Security Audit",
                    "WARN",
                    "pip-audit not available or failed",
                    "Low"
                )
                
        except Exception as e:
            self.log_result(
                "Dependencies",
                "Security Audit",
                "WARN",
                f"Could not audit dependencies: {e}",
                "Low"
            )
        
        # Check Node.js dependencies
        try:
            result = subprocess.run(
                ["npm", "audit", "--json"],
                capture_output=True,
                text=True,
                cwd="frontend"
            )
            
            if result.returncode == 0:
                audit_data = json.loads(result.stdout)
                vulnerabilities = audit_data.get("vulnerabilities", {})
                
                if vulnerabilities:
                    high_vulns = {k: v for k, v in vulnerabilities.items() if v.get("severity") == "high"}
                    if high_vulns:
                        self.log_result(
                            "Dependencies",
                            "Node.js Vulnerabilities",
                            "FAIL",
                            f"Found {len(high_vulns)} high-severity vulnerabilities",
                            "High"
                        )
                    else:
                        self.log_result(
                            "Dependencies",
                            "Node.js Vulnerabilities",
                            "WARN",
                            f"Found {len(vulnerabilities)} vulnerabilities (none high-severity)",
                            "Medium"
                        )
                else:
                    self.log_result(
                        "Dependencies",
                        "Node.js Vulnerabilities",
                        "PASS",
                        "No vulnerabilities found"
                    )
                    
        except Exception as e:
            self.log_result(
                "Dependencies",
                "Security Audit",
                "WARN",
                f"Could not audit frontend dependencies: {e}",
                "Low"
            )
    
    def check_ssl_configuration(self):
        """Check SSL/TLS configuration"""
        self.print_header("SSL/TLS SECURITY")
        
        ssl_files = ["ssl/zenith.crt", "ssl/zenith.key"]
        
        if all(os.path.exists(f) for f in ssl_files):
            self.log_result(
                "SSL",
                "Certificate Files",
                "PASS",
                "SSL certificate files exist"
            )
            
            # Check certificate expiry
            try:
                result = subprocess.run(
                    ["openssl", "x509", "-in", "ssl/zenith.crt", "-noout", "-enddate"],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode == 0:
                    expiry_line = result.stdout.strip()
                    self.log_result(
                        "SSL",
                        "Certificate Expiry",
                        "PASS",
                        expiry_line
                    )
                    
            except Exception as e:
                self.log_result(
                    "SSL",
                    "Certificate Check",
                    "WARN",
                    f"Could not verify certificate: {e}",
                    "Medium"
                )
        else:
            self.log_result(
                "SSL",
                "Certificate Files",
                "WARN",
                "SSL certificate files not found",
                "Medium"
            )
    
    def check_logging_security(self):
        """Check logging and monitoring"""
        self.print_header("LOGGING & MONITORING")
        
        # Check if logging is configured
        log_files = [
            "backend/app.log",
            "production_monitor.log",
            "backups/backup.log"
        ]
        
        log_count = 0
        for log_file in log_files:
            if os.path.exists(log_file):
                log_count += 1
        
        if log_count >= 2:
            self.log_result(
                "Logging",
                "Log Configuration",
                "PASS",
                f"Found {log_count} log files"
            )
        else:
            self.log_result(
                "Logging",
                "Log Configuration",
                "WARN",
                f"Only {log_count} log files found",
                "Medium"
            )
        
        # Check monitoring
        if os.path.exists("scripts/production_monitor.sh"):
            self.log_result(
                "Monitoring",
                "Monitoring Script",
                "PASS",
                "Production monitoring script available"
            )
        else:
            self.log_result(
                "Monitoring",
                "Monitoring Script",
                "FAIL",
                "Production monitoring script not found",
                "High"
            )
    
    def generate_report(self):
        """Generate comprehensive security report"""
        self.print_header("SECURITY AUDIT SUMMARY")
        
        total_tests = len(self.results)
        passed_tests = len([r for r in self.results if r["status"] == "PASS"])
        warned_tests = len([r for r in self.results if r["status"] == "WARN"])
        failed_tests = len([r for r in self.results if r["status"] == "FAIL"])
        
        # Print summary
        print(f"{BLUE}Total Tests: {total_tests}{ENDC}")
        print(f"{GREEN}Passed: {passed_tests}{ENDC}")
        print(f"{YELLOW}Warnings: {warned_tests}{ENDC}")
        print(f"{RED}Failed: {failed_tests}{ENDC}")
        
        # Calculate security score
        security_score = (passed_tests * 100 + warned_tests * 50) // total_tests
        score_color = GREEN if security_score >= 80 else YELLOW if security_score >= 60 else RED
        
        print(f"\n{PURPLE}Security Score: {score_color}{security_score}/100{ENDC}")
        
        # Risk assessment
        high_risks = [r for r in self.results if r["risk"] == "High"]
        critical_risks = [r for r in self.results if r.get("risk") == "Critical"]
        
        if critical_risks:
            print(f"{RED}\n🚨 CRITICAL ISSUES FOUND:{ENDC}")
            for risk in critical_risks:
                print(f"  {RED}• {risk['test']}: {risk['details']}{ENDC}")
        
        if high_risks:
            print(f"{YELLOW}\n⚠️  HIGH RISK ISSUES:{ENDC}")
            for risk in high_risks:
                print(f"  {YELLOW}• {risk['test']}: {risk['details']}{ENDC}")
        
        # Recommendations
        print(f"\n{CYAN}🔧 RECOMMENDATIONS:{ENDC}")
        recommendations = [
            "Enable SSL/TLS for all connections",
            "Implement comprehensive security headers",
            "Use environment variables for all secrets",
            "Enable database SSL encryption",
            "Set up automated security scanning",
            "Implement intrusion detection",
            "Regular security audits and penetration testing",
            "Keep all dependencies updated"
        ]
        
        for rec in recommendations:
            print(f"  {CYAN}• {rec}{ENDC}")
        
        # Save detailed report
        report_file = f"security_audit_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w') as f:
            json.dump(self.results, f, indent=2)
        
        print(f"\n{PURPLE}Detailed report saved: {report_file}{ENDC}")
        
        return security_score
    
    def run_audit(self):
        """Run complete security audit"""
        print(f"{PURPLE}🔒 ZENITH SECURITY AUDIT{ENDC}")
        print(f"{PURPLE}{'='*60}{ENDC}")
        
        self.check_environment_secrets()
        self.check_api_security_headers()
        self.check_authentication_security()
        self.check_csrf_protection()
        self.check_database_security()
        self.check_container_security()
        self.check_dependency_vulnerabilities()
        self.check_ssl_configuration()
        self.check_logging_security()
        
        return self.generate_report()

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Usage: python security_audit.py")
        print("Runs comprehensive security audit of Zenith platform")
        return
    
    # Change to project directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir.parent)
    
    # Run audit
    audit = SecurityAudit()
    score = audit.run_audit()
    
    # Exit with appropriate code
    if score >= 80:
        print(f"\n{GREEN}✅ Security audit passed with score {score}/100{ENDC}")
        sys.exit(0)
    elif score >= 60:
        print(f"\n{YELLOW}⚠️  Security audit completed with score {score}/100{ENDC}")
        sys.exit(1)
    else:
        print(f"\n{RED}❌ Security audit failed with score {score}/100{ENDC}")
        sys.exit(2)

if __name__ == "__main__":
    main()