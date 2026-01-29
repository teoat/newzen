import sys
import os

sys.path.append(os.getcwd())
# Force simple print
print("STARTING TEST")
try:
    from app.modules.ai.router import generate_sql_from_text

    print("IMPORTED")
    q1 = "What is the total inflation?"
    sql1 = generate_sql_from_text(q1)
    print(f"Generated SQL: {sql1}")
except Exception as e:
    print(f"ERROR: {e}")
