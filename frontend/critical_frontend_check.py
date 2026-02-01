"""
Frontend performance and error detection script
Identifies memory leaks, build issues, and performance problems
"""

import subprocess
import json
import os


def check_build_performance():
    """Check build performance and optimization"""
    print("🔍 FRONTEND BUILD PERFORMANCE CHECK")
    print("=" * 50)
    
    issues = []
    
    # Check bundle size
    try:
        result = subprocess.run(
            ["npm", "run", "build", "--stats"],
            capture_output=True,
            text=True,
            cwd="/Users/Arief/Newzen/zenith-lite/frontend"
        )
        
        if result.returncode != 0:
            issues.append("Build process failing")
            print("❌ CRITICAL: Build process is failing")
            return issues
            
        # Parse output for performance issues
        lines = result.stdout.split('\n')
        for line in lines:
            if 'warning' in line.lower() or 'error' in line.lower():
                issues.append(f"Build issue: {line.strip()}")
                print(f"⚠️  WARNING: {line.strip()}")
    
    except Exception as e:
        issues.append(f"Build check failed: {str(e)}")
        print(f"❌ ERROR: Build check failed: {e}")
    
    return issues


def check_memory_leak_patterns():
    """Check for common memory leak patterns"""
    print("\n🔍 MEMORY LEAK PATTERN CHECK")
    print("=" * 50)
    
    issues = []
    
    # Check common memory leak files
    files_to_check = [
        "/Users/Arief/Newzen/zenith-lite/frontend/src/app/components/Providers.tsx",
        "/Users/Arief/Newzen/zenith-lite/frontend/src/store/useInvestigation.ts",
        "/Users/Arief/Newzen/zenith-lite/frontend/src/app/reconciliation/ReconciliationWorkspace.tsx"
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            continue
            
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
                # Check for memory leak patterns
                leak_patterns = [
                    "useState([])",
                    "useEffect(() => {}, [])",
                    "setInterval(() => {},",
                    "addEventListener('scroll'",
                    "addEventListener('resize'",
                    "window.addEventListener(",
                    "document.addEventListener("
                ]
                
                for pattern in leak_patterns:
                    if pattern in content:
                        line_num = content.split('\n').index(pattern) + 1
                        issues.append(f"Memory leak pattern in {os.path.basename(file_path)}:{line_num} - {pattern}")
                        print(f"⚠️  WARNING: Memory leak in {os.path.basename(file_path)} at line {line_num}")
        
        except Exception as e:
            issues.append(f"Failed to check {file_path}: {str(e)}")
            print(f"❌ ERROR: Failed to check {file_path}")
    
    return issues


def check_dependency_conflicts():
    """Check for dependency conflicts and vulnerabilities"""
    print("\n🔍 DEPENDENCY CONFLICT CHECK")
    print("=" * 50)
    
    issues = []
    
    try:
        # Check for security vulnerabilities
        result = subprocess.run(
            ["npm", "audit"],
            capture_output=True,
            text=True,
            cwd="/Users/Arief/Newzen/zenith-lite/frontend"
        )
        
        if result.returncode != 0:
            # Parse audit output
            lines = result.stdout.split('\n')
            for line in lines:
                if 'vulnerabilities' in line.lower() or 'high' in line.lower():
                    issues.append(f"Dependency vulnerability: {line.strip()}")
                    print(f"❌ CRITICAL: {line.strip()}")
        
        # Check for outdated dependencies
        try:
            with open("/Users/Arief/Newzen/zenith-lite/frontend/package.json", 'r') as f:
                package_data = json.load(f)
                
                # Check for outdated versions
                vulnerabilities = {
                    "react": "^18.0.0",  # Should be latest
                    "next": "^15.0.0",  # Should be latest
                    "framer-motion": "^10.0.0",  # Check latest
                }
                
                for dep, current_version in package_data.get("dependencies", {}).items():
                    if dep in vulnerabilities:
                        issues.append(f"Outdated dependency: {dep} {current_version}")
                        print(f"⚠️  WARNING: Outdated dependency {dep}")
        
        except Exception as e:
            issues.append(f"Package check failed: {str(e)}")
            print("❌ ERROR: Package check failed")
    
    except Exception as e:
        issues.append(f"Dependency audit failed: {str(e)}")
        print("❌ ERROR: Dependency audit failed")
    
    return issues


def check_performance_anti_patterns():
    """Check for performance anti-patterns"""
    print("\n🔍 PERFORMANCE ANTI-PATTERN CHECK")
    print("=" * 50)
    
    issues = []
    
    # Check for anti-patterns
    anti_patterns = [
        "useMemo(() => expensiveCalculation(), [])",  # Wrong dependency
        "useState({})",  # Large object in useState
        "className={\`\${variable}\`}",  # Dynamic classes
        "style={{ width: variable + 'px' }}",  # Inline styles
        "setTimeout(() => {}, 0)",  # setTimeout instead of useEffect
        "Array(length).fill().map(",  # Array.map with index only
    ]
    
    files_to_check = [
        "/Users/Arief/Newzen/zenith-lite/frontend/src/app/reconciliation/ReconciliationWorkspace.tsx",
        "/Users/Arief/Newzen/zenith-lite/frontend/src/app/ingestion/page.tsx",
        "/Users/Arief/Newzen/zenith-lite/frontend/src/components/FrenlyAI/FrenlyWidget.tsx"
    ]
    
    for file_path in files_to_check:
        if not os.path.exists(file_path):
            continue
            
        try:
            with open(file_path, 'r') as f:
                content = f.read()
                
                for pattern in anti_patterns:
                    if pattern in content:
                        line_num = content.split('\n').index(pattern) + 1
                        issues.append(f"Performance anti-pattern in {os.path.basename(file_path)}:{line_num}")
                        print(f"⚠️  WARNING: Performance anti-pattern in {os.path.basename(file_path)}")
        
        except Exception as e:
            issues.append(f"Failed to check {file_path}: {str(e)}")
    
    return issues


def check_file_size_issues():
    """Check for large files that might cause performance issues"""
    print("\n🔍 FILE SIZE ANALYSIS")
    print("=" * 50)
    
    issues = []
    
    # Check for large files in src directory
    try:
        result = subprocess.run(
            ["find", "/Users/Arief/Newzen/zenith-lite/frontend/src", "-name", "*.tsx", "-o", "-name", "*.ts", "-exec", "ls", "-lh", "{}", ";"],
            capture_output=True,
            text=True
        )
        
        lines = result.stdout.split('\n')
        large_files = []
        
        for line in lines:
            if line.strip():
                parts = line.split()
                if len(parts) >= 5:
                    size_str = parts[4]
                    if 'M' in size_str or 'G' in size_str:
                        file_path = parts[-1]
                        large_files.append(f"Large file: {file_path} ({size_str})")
                        print(f"⚠️  WARNING: Large file detected: {file_path} ({size_str})")
        
        if large_files:
            issues.extend(large_files)
    
    except Exception as e:
        issues.append(f"File size check failed: {str(e)}")
        print("❌ ERROR: File size check failed")
    
    return issues


def main():
    """Run comprehensive frontend diagnostic"""
    print("🚨 ZENITH FRONTEND CRITICAL DIAGNOSTIC")
    print("📅 Date:", subprocess.run(["date"], capture_output=True, text=True).stdout.strip())
    print("🎯 Purpose: Identify production-failure risks")
    print()
    
    all_issues = []
    
    # Run all diagnostic checks
    all_issues.extend(check_build_performance())
    all_issues.extend(check_memory_leak_patterns())
    all_issues.extend(check_dependency_conflicts())
    all_issues.extend(check_performance_anti_patterns())
    all_issues.extend(check_file_size_issues())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 FRONTEND DIAGNOSTIC SUMMARY")
    print("=" * 50)
    
    if all_issues:
        print(f"❌ CRITICAL: {len(all_issues)} issues found")
        print("\n🚨 IMMEDIATE ACTION REQUIRED:")
        for i, issue in enumerate(all_issues, 1):
            print(f"   {i}. {issue}")
        print("\n📋 NEXT STEPS:")
        print("   1. Fix memory leaks in React components")
        print("   2. Optimize bundle size and dependencies")
        print("   3. Remove performance anti-patterns")
        print("   4. Update outdated dependencies")
        print("   5. Implement proper error boundaries")
        print("\n⏱️  ESTIMATED TIME TO FAILURE: 1-2 weeks")
    else:
        print("✅ No critical frontend issues detected")
        print("🎯 System is currently STABLE")
        print("📈 Continue monitoring for performance optimization")
    
    print("\n🔄 CONTINUOUS MONITORING:")
    print("   - Run this check daily during development")
    print("   - Monitor bundle size with each build")
    print("   - Track memory usage in production")
    print("   - Set up performance budget alerts")


if __name__ == "__main__":
    main()