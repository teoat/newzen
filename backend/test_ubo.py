import sys
import os
from sqlmodel import Session, select
from app.models import Entity
from app.modules.forensic.service import BeneficialOwnershipEngine
from app.core.db import engine

sys.path.append(os.getcwd())


def test_ubo():
    with Session(engine) as session:
        # Find shell_a
        shell_a = session.exec(select(Entity).where(Entity.name == "PT Mega Construction")).first()
        if not shell_a:
            print("Shell A not found")
            return
        print(f"Resolving UBO for {shell_a.name} ({shell_a.id})...")
        ubos = BeneficialOwnershipEngine.resolve_ubo(session, shell_a.id)
        for ubo in ubos:
            print(
                f"UBO Found: {ubo['name']} | Stake: {ubo['stake']}% | Candidate: {ubo['is_ubo_candidate']}"
            )
            if "intermediate_company" in ubo:
                print(f"  Path: via {ubo['intermediate_company']}")


if __name__ == "__main__":
    test_ubo()
