"""
Unified Alert Service
Merges ProactiveMonitor and FrenlyContextBuilder alert generation
Provides deduplication, prioritization, and persistence
"""

import hashlib
import logging
from typing import List
from datetime import datetime, UTC
from sqlmodel import Session, select
from app.models import FraudAlert, Transaction
from app.modules.ai.models import UnifiedAlert, ContextSnapshot

logger = logging.getLogger(__name__)


class UnifiedAlertService:
    """
    Centralized alert generation and management.
    Replaces fragmented alert logic across ProactiveMonitor and FrenlyContextBuilder.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def generate_alerts(
        self, 
        context: ContextSnapshot,
        check_all: bool = False
    ) -> List[UnifiedAlert]:
        """
        Run all detection rules and return unified, deduplicated alerts.
        
        Args:
            context: User's current context for personalization
            check_all: If True, run all checks; if False, only context-relevant checks
        
        Returns:
            List of deduplicated, prioritized alerts
        """
        raw_alerts: List[UnifiedAlert] = []
        
        try:
            # 1. Database anomaly detection
            raw_alerts.extend(self._check_high_risk_transactions(context))
            raw_alerts.extend(self._check_velocity_anomalies(context))
            
            if check_all or context.page_path in ['/forensic/map', '/reconciliation']:
                raw_alerts.extend(self._check_gps_anomalies(context))
            
            if check_all or 'round_amount' in context.applied_filters:
                raw_alerts.extend(self._check_round_amounts(context))
            
            # 2. Reconciliation-specific checks
            if context.page_path == '/reconciliation':
                raw_alerts.extend(self._check_reconciliation_gaps(context))
            
            # 3. Retrieve persisted database alerts
            raw_alerts.extend(self._fetch_db_alerts(context))
            
            # 4. Deduplicate using fingerprinting
            unique_alerts = self._deduplicate(raw_alerts)
            
            # 5. Prioritize by severity + user relevance
            prioritized_alerts = self._prioritize(unique_alerts, context)
            
            # 6. Persist new alerts to database
            self._persist_alerts(prioritized_alerts)
            
            return prioritized_alerts
        
        except Exception as e:
            logger.error(f"Alert generation failed: {e}")
            return []
    
    def _check_high_risk_transactions(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Detect transactions with risk_score > 70"""
        alerts = []
        
        high_risk = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == context.project_id)
            .where(Transaction.risk_score >= 70)
            .limit(10)
        ).all()
        
        for txn in high_risk:
            alerts.append(UnifiedAlert(
                id=f"ALERT-HR-{txn.id}",
                type="HIGH_RISK_TRANSACTION",
                severity="HIGH" if txn.risk_score < 85 else "CRITICAL",
                message=f"High-risk transaction detected: {txn.counterparty_name} - ${txn.amount:,.2f}",
                project_id=context.project_id,
                transaction_id=txn.id,
                action={
                    "label": "Investigate Transaction",
                    "route": f"/investigate?transaction_id={txn.id}"
                },
                fingerprint=self._generate_fingerprint("HIGH_RISK", txn.id),
                source="ProactiveMonitor",
                metadata={"risk_score": txn.risk_score, "amount": txn.amount}
            ))
        
        return alerts
    
    def _check_velocity_anomalies(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Detect rapid transaction bursts (potential smurfing)"""
        alerts = []
        
        # Query transactions with velocity_flag = HIGH_FREQUENCY
        velocity_flagged = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == context.project_id)
            .where(Transaction.forensic_triggers.like('%VELOCITY:%'))
            .limit(5)
        ).all()
        
        if len(velocity_flagged) > 0:
            alerts.append(UnifiedAlert(
                id=f"ALERT-VEL-{context.project_id}",
                type="VELOCITY_BURST",
                severity="CRITICAL",
                message=f"Detected {len(velocity_flagged)} high-velocity transactions - potential structuring",
                project_id=context.project_id,
                action={
                    "label": "View Pattern Analysis",
                    "route": "/forensic/analytics/predictive"
                },
                fingerprint=self._generate_fingerprint("VELOCITY", context.project_id),
                source="ProactiveMonitor"
            ))
        
        return alerts
    
    def _check_gps_anomalies(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Detect transactions logged far from project site"""
        alerts = []
        
        # Find transactions with DISTANT_VENDOR_RISK flag
        distant = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == context.project_id)
            .where(Transaction.forensic_triggers.like('%DISTANT_VENDOR_RISK%'))
            .limit(5)
        ).all()
        
        if len(distant) > 2:
            alerts.append(UnifiedAlert(
                id=f"ALERT-GPS-{context.project_id}",
                type="GPS_ANOMALY",
                severity="MEDIUM",
                message=f"{len(distant)} transactions from vendors >50 miles from project site",
                project_id=context.project_id,
                action={
                    "label": "View Location Map",
                    "route": "/forensic/map"
                },
                fingerprint=self._generate_fingerprint("GPS", context.project_id),
                source="VendorLocationReconciliation"
            ))
        
        return alerts
    
    def _check_reconciliation_gaps(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Check for unreconciled transactions"""
        alerts = []
        
        # Count transactions without reconciliation status
        unreconciled_count = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == context.project_id)
            .where(Transaction.forensic_triggers.like('%UNVERIFIED_SPEND%'))
        ).all()
        
        if len(unreconciled_count) > 10:
            alerts.append(UnifiedAlert(
                id=f"ALERT-REC-{context.project_id}",
                type="RECONCILIATION_GAP",
                severity="HIGH",
                message=f"{len(unreconciled_count)} transactions lack evidence verification",
                project_id=context.project_id,
                action={
                    "label": "Start Reconciliation",
                    "route": "/reconciliation"
                },
                fingerprint=self._generate_fingerprint("RECONCILIATION", context.project_id),
                source="SiteTelemetryService"
            ))
        
        return alerts
    
    def _check_round_amounts(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Detect suspicious clustering of round-number transactions"""
        alerts = []
        
        round_txns = self.db.exec(
            select(Transaction)
            .where(Transaction.project_id == context.project_id)
            .where(Transaction.amount % 1000 == 0)  # Perfectly round thousands
            .limit(20)
        ).all()
        
        if len(round_txns) > 5:
            total = sum(t.amount for t in round_txns)
            alerts.append(UnifiedAlert(
                id=f"ALERT-ROUND-{context.project_id}",
                type="ROUND_AMOUNT_CLUSTERING",
                severity="MEDIUM",
                message=f"{len(round_txns)} round-amount transactions totaling ${total:,.2f}",
                project_id=context.project_id,
                fingerprint=self._generate_fingerprint("ROUND", context.project_id),
                source="ProactiveMonitor",
                metadata={"count": len(round_txns), "total_amount": total}
            ))
        
        return alerts
    
    def _fetch_db_alerts(self, context: ContextSnapshot) -> List[UnifiedAlert]:
        """Retrieve unresolved alerts from FraudAlert table"""
        alerts = []
        
        db_alerts = self.db.exec(
            select(FraudAlert)
            .where(FraudAlert.project_id == context.project_id)
            .where(FraudAlert.status == "OPEN")
            .limit(10)
        ).all()
        
        for alert in db_alerts:
            alerts.append(UnifiedAlert(
                id=alert.id,
                type=alert.alert_type,
                severity=alert.severity,
                message=alert.message,
                project_id=alert.project_id,
                transaction_id=alert.transaction_id,
                fingerprint=self._generate_fingerprint(alert.alert_type, alert.id),
                source="Database",
                created_at=alert.created_at
            ))
        
        return alerts
    
    def _deduplicate(self, alerts: List[UnifiedAlert]) -> List[UnifiedAlert]:
        """Remove duplicate alerts using fingerprint hashing"""
        seen_fingerprints = set()
        unique_alerts = []
        
        for alert in alerts:
            if alert.fingerprint not in seen_fingerprints:
                seen_fingerprints.add(alert.fingerprint)
                unique_alerts.append(alert)
            else:
                logger.debug(f"Deduplicated alert: {alert.type} - {alert.message[:50]}")
        
        logger.info(f"Deduplication: {len(alerts)} → {len(unique_alerts)} alerts")
        return unique_alerts
    
    def _prioritize(
        self, 
        alerts: List[UnifiedAlert], 
        context: ContextSnapshot
    ) -> List[UnifiedAlert]:
        """
        Sort alerts by relevance to user's current context.
        Priority: CRITICAL severity + context-relevant > others
        """
        def relevance_score(alert: UnifiedAlert) -> int:
            score = 0
            
            # Severity weight
            severity_weights = {"CRITICAL": 100, "HIGH": 50, "MEDIUM": 25, "LOW": 10}
            score += severity_weights.get(alert.severity, 0)
            
            # Context relevance
            if alert.transaction_id in context.selected_transaction_ids:
                score += 200  # Highly relevant - user is viewing this transaction
            
            if alert.case_id == context.active_case_id:
                score += 150
            
            if alert.type in context.applied_filters.values():
                score += 50
            
            # Recency
            age_hours = (datetime.now(UTC) - alert.created_at).total_seconds() / 3600
            if age_hours < 1:
                score += 30
            elif age_hours < 24:
                score += 10
            
            return score
        
        return sorted(alerts, key=relevance_score, reverse=True)
    
    def _persist_alerts(self, alerts: List[UnifiedAlert]) -> None:
        """Store alerts in database if not already present (Bulk Optimized)"""
        if not alerts:
            return

        # 1. Collect all potential IDs
        alert_ids = [alert.id for alert in alerts]
        
        # 2. Fetch existing IDs in one query to avoid N+1
        existing_alerts = self.db.exec(
            select(FraudAlert.id).where(FraudAlert.id.in_(alert_ids))
        ).all()
        existing_ids = set(existing_alerts)
        
        # 3. Filter out existing
        new_alerts = [a for a in alerts if a.id not in existing_ids]
        
        if not new_alerts:
            return

        # 4. Bulk Create
        for alert in new_alerts:
            db_alert = FraudAlert(
                id=alert.id,
                project_id=alert.project_id,
                transaction_id=alert.transaction_id,
                alert_type=alert.type,
                severity=alert.severity,
                message=alert.message,
                status="OPEN",
                risk_score=90.0 if alert.severity == "CRITICAL" else 70.0, # Default risk score if missing
                metadata_json=alert.metadata or {},
                created_at=alert.created_at
            )
            self.db.add(db_alert)
        
        try:
            self.db.commit()
            logger.info(f"Persisted {len(new_alerts)} new alerts.")
        except Exception as e:
            logger.error(f"Failed to persist alerts: {e}")
            self.db.rollback()
    
    def dismiss_alert(self, alert_id: str, user_id: str) -> bool:
        """Mark an alert as dismissed"""
        alert = self.db.exec(
            select(FraudAlert).where(FraudAlert.id == alert_id)
        ).first()
        
        if alert:
            alert.status = "DISMISSED"
            alert.resolved_at = datetime.now(UTC)
            alert.resolved_by = user_id
            self.db.commit()
            return True
        
        return False
    
    @staticmethod
    def _generate_fingerprint(alert_type: str, identifier: str) -> str:
        """Generate unique fingerprint for deduplication"""
        content = f"{alert_type}:{identifier}"
        return hashlib.md5(content.encode()).hexdigest()
