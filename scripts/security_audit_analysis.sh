
#!/bin/bash
# Security audit with log analysis

echo "Recent Security Events:"
./scripts/security_audit.py | head -20

echo "Failed Authentication Attempts:"
grep "login_failed" logs/audit.log | tail -10

echo "API Access Patterns:"
grep "api_request" logs/audit.log | grep -E "status_code.*[45][0-9][0-9]" | tail -10

echo "Data Access Audit:"
grep "data_access" logs/audit.log | tail -10
        