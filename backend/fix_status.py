
from app.core.db import engine
from sqlalchemy import text

def fix_transaction_status():
    with engine.connect() as conn:
        print("Updating transaction status to uppercase...")
        conn.execute(text("UPDATE transaction SET status = UPPER(status)"))
        # Also fix other potential lowercase enums if necessary
        # e.g., category_code, verification_status etc.
        conn.commit()
        print("Done.")

if __name__ == "__main__":
    fix_transaction_status()
