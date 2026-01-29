import sys
import os

sys.path.append(os.getcwd())
try:
    from sqlmodel import Session, select
    from app.core.db import engine
    from app.models import Transaction

    with Session(engine) as session:
        txs = session.exec(select(Transaction)).all()
        with open("output.txt", "w") as f:
            f.write("Transactions count: " + str(len(txs)) + "\n")
            for tx in txs:
                f.write(" - " + str(tx.description) + ": " + str(tx.actual_amount) + "\n")
except Exception as e:
    with open("output.txt", "w") as f:
        f.write("ERROR: " + str(e) + "\n")
