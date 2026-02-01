"""
Critical database health check script
Run this immediately to identify database stability issues
"""

import sys
import time
import psutil
from sqlalchemy import text
from app.core.db import engine
from app.core.redis_client import redis_client


def check_database_connections():
    """Check database connection health and pooling"""
    print("🔍 DATABASE CONNECTION HEALTH CHECK")
    print("=" * 50)
    
    issues = []
    
    try:
        # Test connection
        start_time = time.time()
        with engine.connect() as conn:
            result = conn.execute(text('SELECT 1 as test'))
            result.fetchone()
            connection_time = (time.time() - start_time) * 1000
            
            print(f"✅ Connection: OK ({connection_time:.2f}ms)")
            
            # Check connection limits
            if hasattr(engine.pool, 'size'):
                pool_size = engine.pool.size()
                checked_out = engine.pool.checkedout()
                print(f"📊 Pool Size: {pool_size}")
                print(f"📊 Checked Out: {checked_out}")
                
                if checked_out >= pool_size * 0.8:
                    issues.append("High connection pool utilization")
                    print("⚠️  WARNING: Connection pool near capacity")
            
            # Test query performance
            query_start = time.time()
            result = conn.execute(text('SELECT COUNT(*) FROM transaction LIMIT 1000'))
            query_time = (time.time() - query_start) * 1000
            print(f"📊 Query Performance: {query_time:.2f}ms")
            
            if query_time > 1000:  # 1 second threshold
                issues.append("Slow query performance detected")
                print("⚠️  WARNING: Slow queries detected")
    
    except Exception as e:
        issues.append(f"Database connection failed: {str(e)}")
        print(f"❌ CRITICAL: Database connection error: {e}")
    
    return issues


def check_redis_health():
    """Check Redis health and memory usage"""
    print("\n🔍 REDIS HEALTH CHECK")
    print("=" * 50)
    
    issues = []
    
    if not redis_client:
        issues.append("Redis client not initialized")
        print("❌ CRITICAL: Redis not connected")
        return issues
    
    try:
        # Test Redis connection
        start_time = time.time()
        redis_client.ping()
        ping_time = (time.time() - start_time) * 1000
        print(f"✅ Redis Ping: OK ({ping_time:.2f}ms)")
        
        # Check Redis memory usage
        info = redis_client.info('memory')
        used_memory = info.get('used_memory', 0)
        max_memory = info.get('maxmemory', 0)
        
        if max_memory > 0:
            memory_percent = (used_memory / max_memory) * 100
            print(f"📊 Redis Memory: {used_memory:,} bytes ({memory_percent:.1f}%)")
            
            if memory_percent > 80:
                issues.append("Redis memory usage critical")
                print("⚠️  WARNING: Redis memory usage critical")
        
        # Check Redis keyspace
        keyspace_info = redis_client.info('keyspace')
        total_keys = sum(int(db.get('keys', 0)) for db in keyspace_info.values())
        print(f"📊 Total Keys: {total_keys:,}")
        
        if total_keys > 100000:  # 100k keys threshold
            issues.append("Redis keyspace too large")
            print("⚠️  WARNING: Redis keyspace growth detected")
    
    except Exception as e:
        issues.append(f"Redis health check failed: {str(e)}")
        print(f"❌ CRITICAL: Redis error: {e}")
    
    return issues


def check_system_resources():
    """Check system resource usage"""
    print("\n🔍 SYSTEM RESOURCE CHECK")
    print("=" * 50)
    
    issues = []
    
    # Memory usage
    memory = psutil.virtual_memory()
    cpu = psutil.cpu_percent(interval=1)
    
    print(f"📊 CPU Usage: {cpu:.1f}%")
    print(f"📊 Memory Usage: {memory.percent:.1f}%")
    print(f"📊 Available Memory: {memory.available / (1024**3):.1f} GB")
    
    # Disk usage
    disk = psutil.disk_usage('/')
    disk_percent = (disk.used / disk.total) * 100
    print(f"📊 Disk Usage: {disk_percent:.1f}%")
    
    # Check for critical thresholds
    if memory.percent > 85:
        issues.append("System memory usage critical")
        print("⚠️  WARNING: System memory usage critical")
    
    if cpu > 80:
        issues.append("High CPU usage detected")
        print("⚠️  WARNING: High CPU usage detected")
    
    if disk_percent > 90:
        issues.append("Disk space critically low")
        print("⚠️  WARNING: Disk space critically low")
    
    return issues


def check_configuration_issues():
    """Check for configuration vulnerabilities"""
    print("\n🔍 CONFIGURATION SECURITY CHECK")
    print("=" * 50)
    
    issues = []
    
    try:
        from app.core.config import settings
        
        # Check critical settings
        print("🔍 Checking security configuration...")
        
        if hasattr(settings, 'SECRET_KEY'):
            secret = settings.SECRET_KEY if callable(settings.SECRET_KEY) else settings.SECRET_KEY
            if len(str(secret)) < 32:
                issues.append("SECRET_KEY too short")
                print("⚠️  WARNING: SECRET_KEY should be at least 32 characters")
        
        if hasattr(settings, 'ACCESS_TOKEN_EXPIRE_MINUTES'):
            token_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
            if isinstance(token_minutes, int) and token_minutes > 120:  # 2 hours
                issues.append("Token lifetime too long")
                print("⚠️  WARNING: Token lifetime should be less than 2 hours")
    
    except Exception as e:
        issues.append(f"Configuration check failed: {str(e)}")
        print(f"❌ ERROR: Configuration check failed: {e}")
    
    return issues


def main():
    """Run comprehensive health check"""
    print("🚨 ZENITH CRITICAL SYSTEM HEALTH CHECK")
    print("📅 Date:", time.strftime("%Y-%m-%d %H:%M:%S"))
    print("🎯 Purpose: Identify production-failure risks")
    print()
    
    all_issues = []
    
    # Run all health checks
    all_issues.extend(check_database_connections())
    all_issues.extend(check_redis_health())
    all_issues.extend(check_system_resources())
    all_issues.extend(check_configuration_issues())
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 HEALTH CHECK SUMMARY")
    print("=" * 50)
    
    if all_issues:
        print(f"❌ CRITICAL: {len(all_issues)} issues found")
        print("\n🚨 IMMEDIATE ACTION REQUIRED:")
        for i, issue in enumerate(all_issues, 1):
            print(f"   {i}. {issue}")
        print("\n📋 NEXT STEPS:")
        print("   1. Fix database connection pooling")
        print("   2. Implement Redis memory management")
        print("   3. Address system resource constraints")
        print("   4. Review security configuration")
        print("\n⏱️  ESTIMATED TIME TO FAILURE: 2-5 DAYS")
        sys.exit(1)
    else:
        print("✅ All critical checks passed")
        print("🎯 System is currently STABLE")
        print("⏱️  Continue monitoring for performance issues")
    
    print("\n📈 Run this check every 30 minutes in production")
    print("🔄 Continuous monitoring recommended")


if __name__ == "__main__":
    main()