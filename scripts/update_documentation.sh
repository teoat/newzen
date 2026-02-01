
#!/bin/bash
# Keep documentation synced with code

echo "Updating documentation..."

# Extract API endpoints from code
echo "Extracting API endpoints from source code..."
find backend -name "*.py" | xargs grep -r "@router" | head -20 > api_endpoints.txt

# Generate new documentation if needed
echo "Checking for documentation updates..."
find backend -name "*.py" -newer docs/ | head -10 > new_endpoints.txt

if [ -s new_endpoints.txt ]; then
    echo "New endpoints detected - regenerating documentation"
    python generate_standalone_docs.py
else
    echo "Documentation is up to date"
fi

echo "Documentation update complete!"
        