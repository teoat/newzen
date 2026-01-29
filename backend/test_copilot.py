import sys
import os
from app.modules.ai.router import generate_sql_from_text

# Make sure we flush stdout
sys.stdout.reconfigure(line_buffering=True)

sys.path.append(os.getcwd())


def run_test():
    try:
        # 1. Test SQL Generation Logic
        q1 = "What is the total inflation?"
        sql1 = generate_sql_from_text(q1)
        print(f"Query: {q1}")
        print(f"Generated SQL: {sql1}")
        if "SUM(delta_inflation)" not in sql1:
            print("FAILED: SQL generation incorrect")
            sys.exit(1)
        print("SUCCESS: Logic check passed")
    except Exception as e:
        print(e)


if __name__ == "__main__":
    run_test()
