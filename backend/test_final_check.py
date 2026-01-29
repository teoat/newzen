import sys
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction

# Make sure we flush stdout
sys.stdout.reconfigure(line_buffering=True)

try:
    with Session(engine) as session:
        txs = session.exec(select(Transaction)).all()
        # write to file to be sure
        with open("final_check_output.txt", "w") as f:
            f.write(f"Final Transaction Count: {len(txs)}\n")
            for t in txs:
                f.write(f" - {t.description}: {t.actual_amount}\n")
        print("Done check.")
except Exception as e:
    print(e)
