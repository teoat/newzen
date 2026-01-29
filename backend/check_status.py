import sys
import os
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction

sys.stdout.reconfigure(line_buffering=True)
sys.path.append(os.getcwd())

try:
    with Session(engine) as session:
        txs = session.exec(select(Transaction)).all()
        for t in txs:
            print(f"ID: {t.id} - VerifyStatus: {getattr(t, 'verification_status', 'MISSING')}")
except Exception as e:
    print(f"Error: {e}")
