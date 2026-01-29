#!/usr/bin/env python3
"""
Zenith Platform Performance Benchmarking Tool
Measures API response times and database query performance.
"""

import asyncio
import time
import statistics
from typing import List, Dict, Any
import httpx
import sqlalchemy as sa
from sqlmodel import Session, create_engine, select
from tabulate import tabulate
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.models import Transaction, Project, FraudAlert
from app.core.db import engine


class PerformanceBenchmark:
    """Performance benchmarking suite"""
    
    def __init__(self, api_base_url: str = "http://localhost:8200"):
        self.api_base_url = api_base_url
        self.results: List[Dict[str, Any]] = []
    
    async def benchmark_api_endpoint(
        self,
        name: str,
        method: str,
        url: str,
        iterations: int = 10,
        **kwargs
    ) -> Dict[str, Any]:
        """Benchmark an API endpoint"""
        print(f"Benchmarking {name}...", end="")
        
        times = []
        errors = 0
        
        async with httpx.AsyncClient() as client:
            for _ in range(iterations):
                start = time.time()
                try:
                    if method.upper() == "GET":
                        response = await client.get(url, **kwargs)
                    elif method.upper() == "POST":
                        response = await client.post(url, **kwargs)
                    
                    elapsed = (time.time() - start) * 1000  # ms
                    
                    if response.status_code < 400:
                        times.append(elapsed)
                    else:
                        errors += 1
                except Exception:
                    errors += 1
        
        if times:
            result = {
                "name": name,
                "avg_ms": round(statistics.mean(times), 2),
                "min_ms": round(min(times), 2),
                "max_ms": round(max(times), 2),
                "p50_ms": round(statistics.median(times), 2),
                "p95_ms": round(
                    sorted(times)[int(len(times) * 0.95)], 2
                ) if len(times) > 1 else round(times[0], 2),
                "errors": errors,
                "success_rate": f"{((len(times)) / iterations) * 100:.1f}%"
            }
        else:
            result = {
                "name": name,
                "avg_ms": "FAILED",
                "min_ms": "-",
                "max_ms": "-",
                "p50_ms": "-",
                "p95_ms": "-",
                "errors": errors,
                "success_rate": "0%"
            }
        
        print(f" ✓ ({result['avg_ms']}ms avg)")
        self.results.append(result)
        return result
    
    def benchmark_db_query(
        self,
        name: str,
        query_func,
        iterations: int = 10
    ) -> Dict[str, Any]:
        """Benchmark a database query"""
        print(f"Benchmarking {name}...", end="")
        
        times = []
        errors = 0
        
        with Session(engine) as session:
            for _ in range(iterations):
                start = time.time()
                try:
                    query_func(session)
                    elapsed = (time.time() - start) * 1000
                    times.append(elapsed)
                except Exception as e:
                    errors += 1
                    print(f" Error: {e}")
        
        if times:
            result = {
                "name": name,
                "avg_ms": round(statistics.mean(times), 2),
                "min_ms": round(min(times), 2),
                "max_ms": round(max(times), 2),
                "p50_ms": round(statistics.median(times), 2),
                "p95_ms": round(
                    sorted(times)[int(len(times) * 0.95)], 2
                ) if len(times) > 1 else round(times[0], 2),
                "errors": errors,
                "success_rate": f"{((len(times)) / iterations) * 100:.1f}%"
            }
        else:
            result = {
                "name": name,
                "avg_ms": "FAILED",
                "min_ms": "-",
                "max_ms": "-",
                "p50_ms": "-",
                "p95_ms": "-",
                "errors": errors,
                "success_rate": "0%"
            }
        
        print(f" ✓ ({result['avg_ms']}ms avg)")
        self.results.append(result)
        return result
    
    def print_results(self):
        """Print benchmark results in table format"""
        headers = ["Test Name", "Avg (ms)", "Min (ms)", "Max (ms)",
                   "P50 (ms)", "P95 (ms)", "Success Rate"]
        
        table_data = [
            [
                r["name"],
                r["avg_ms"],
                r["min_ms"],
                r["max_ms"],
                r["p50_ms"],
                r["p95_ms"],
                r["success_rate"]
            ]
            for r in self.results
        ]
        
        print("\n" + "=" * 80)
        print("ZENITH PLATFORM - PERFORMANCE BENCHMARK RESULTS")
        print("=" * 80)
        print(tabulate(table_data, headers=headers, tablefmt="grid"))
        
        # Check if targets are met
        print("\n" + "=" * 80)
        print("PERFORMANCE TARGETS (< 2000ms)")
        print("=" * 80)
        
        passed = 0
        failed = 0
        
        for r in self.results:
            if isinstance(r["avg_ms"], (int, float)):
                if r["avg_ms"] < 2000:
                    status = "✅ PASS"
                    passed += 1
                else:
                    status = "❌ FAIL"
                    failed += 1
                print(f"{status} - {r['name']}: {r['avg_ms']}ms")
            else:
                failed += 1
                print(f"❌ FAIL - {r['name']}: ERROR")
        
        print("\n" + "=" * 80)
        print(f"Summary: {passed} passed, {failed} failed")
        print("=" * 80)


async def main():
    """Run all benchmarks"""
    bench = PerformanceBenchmark()
    
    print("\n🚀 Starting Performance Benchmarks...\n")
    
    # API Endpoint Benchmarks
    print("=" * 80)
    print("API ENDPOINT BENCHMARKS")
    print("=" * 80 + "\n")
    
    await bench.benchmark_api_endpoint(
        "Health Check",
        "GET",
        f"{bench.api_base_url}/health"
    )
    
    await bench.benchmark_api_endpoint(
        "Project List",
        "GET",
        f"{bench.api_base_url}/api/v1/project"
    )
    
    # Database Query Benchmarks
    print("\n" + "=" * 80)
    print("DATABASE QUERY BENCHMARKS")
    print("=" * 80 + "\n")
    
    bench.benchmark_db_query(
        "Transaction Query (All)",
        lambda session: session.exec(select(Transaction)).all()
    )
    
    bench.benchmark_db_query(
        "Transaction Query (Indexed - Sender)",
        lambda session: session.exec(
            select(Transaction).where(Transaction.sender == "Test Vendor")
        ).all()
    )
    
    bench.benchmark_db_query(
        "High-Risk Transaction Query",
        lambda session: session.exec(
            select(Transaction).where(Transaction.risk_score > 0.7)
        ).all()
    )
    
    bench.benchmark_db_query(
        "Project Count",
        lambda session: session.exec(
            select(sa.func.count(Project.id))
        ).one()
    )
    
    bench.benchmark_db_query(
        "Recent Fraud Alerts",
        lambda session: session.exec(
            select(FraudAlert)
            .order_by(FraudAlert.created_at.desc())
            .limit(10)
        ).all()
    )
    
    # Print results
    bench.print_results()


if __name__ == "__main__":
    asyncio.run(main())
