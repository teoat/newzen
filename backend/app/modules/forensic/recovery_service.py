from typing import Dict, Any
import random


class AssetRecoveryService:
    @staticmethod
    def trace_asset(project_id: str) -> Dict[str, Any]:
        """
        Simulates multi-ledger tracing to find illicit capital flows.
        Cross-chain analysis (Ethereum, Tron, Bitcoin) + Traditional Bank.
        """
        # Mock Graph Data for Visualization
        nodes = [
            {
                "id": "ROOT_FUND",
                "label": "Project Disbursal",
                "type": "FIAT",
                "risk": 0,
            },
            {"id": "MULE_1", "label": "CV. Fake Vendor", "type": "ENTITY", "risk": 0.9},
            {
                "id": "MULE_2",
                "label": "Personal Acct (CEO)",
                "type": "ENTITY",
                "risk": 0.8,
            },
            {
                "id": "CRYPTO_EX",
                "label": "Binance Deposit",
                "type": "CRYPTO",
                "risk": 0.95,
            },
            {
                "id": "OFFSHORE",
                "label": "Shell Corp (BVI)",
                "type": "OFFSHORE",
                "risk": 0.99,
            },
            {
                "id": "REAL_ASSET",
                "label": "Luxury Property",
                "type": "ASSET",
                "risk": 0.7,
            },
        ]
        links = [
            {
                "source": "ROOT_FUND",
                "target": "MULE_1",
                "value": 500000000,
                "currency": "IDR",
            },
            {
                "source": "MULE_1",
                "target": "MULE_2",
                "value": 200000000,
                "currency": "IDR",
            },
            {
                "source": "MULE_1",
                "target": "CRYPTO_EX",
                "value": 300000000,
                "currency": "USDT (TRC20)",
            },
            {
                "source": "CRYPTO_EX",
                "target": "OFFSHORE",
                "value": 18500,
                "currency": "USD",
            },
            {
                "source": "MULE_2",
                "target": "REAL_ASSET",
                "value": 150000000,
                "currency": "IDR",
            },
        ]
        return {
            "project_id": project_id,
            "trace_id": f"TRC-{random.randint(1000, 9999)}",
            "confidence": 0.88,
            "graph": {"nodes": nodes, "links": links},
            "recoverable_amount_estimate": 350000000,  # IDR equivalent
        }
