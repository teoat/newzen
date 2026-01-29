import asyncio
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Transaction, AuditLog
from app.core.audit import AuditLogger
from app.modules.fraud.reconciliation_router import detect_forensic_triggers


async def run_test():
    with Session(engine) as session:
        # Pre-check
        session.exec(select(AuditLog)).all()
        # Fetch Bapa Banda transaction
        stmt = select(Transaction).where(Transaction.description.contains("Bapa Banda"))
        tx = session.exec(stmt).first()
        if not tx:
            return
        old_status = tx.status
        # Run Forensic Logic
        triggers = detect_forensic_triggers(tx, session)
        # Simulate router logic for logging
        if triggers:
            if tx.status != old_status:
                AuditLogger.log_change(
                    session=session,
                    entity_type="Transaction",
                    entity_id=tx.id,
                    action="FORENSIC_FLAG",
                    field_name="status",
                    old_value=old_status,
                    new_value=tx.status,
                    reason="; ".join(triggers),
                )
        session.add(tx)
        session.commit()
        with open("output_log.txt", "w") as f:
            logs_after = session.exec(select(AuditLog)).all()
            f.write(f"Audit Logs after: {len(logs_after)}\n")
            for log in logs_after:
                f.write(
                    f"LOG: [{log.action}] {log.entity_type} {log.entity_id} changed {log.field_name} from {log.old_value} to {log.new_value} | Reason: {log.change_reason}\n"
                )


if __name__ == "__main__":
    asyncio.run(run_test())
