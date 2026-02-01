"""
Multi-Factor Authentication (MFA) using TOTP.
Provides additional security layer for admin users.
"""

import pyotp
import qrcode
from io import BytesIO
import base64
from datetime import datetime, UTC
from sqlmodel import Session
from app.models import User
import logging

logger = logging.getLogger(__name__)


class MFAService:
    """
    Time-based One-Time Password (TOTP) MFA implementation.
    Compatible with Google Authenticator, Authy, etc.
    """

    def __init__(self):
        self.issuer_name = "Zenith Forensic"

    def generate_secret(self) -> str:
        """
        Generate a new TOTP secret for a user.
        
        Returns:
            Base32-encoded secret key
        """
        return pyotp.random_base32()

    def get_provisioning_uri(
        self,
        user_email: str,
        secret: str
    ) -> str:
        """
        Generate provisioning URI for QR code.
        
        Args:
            user_email: User's email address
            secret: TOTP secret key
            
        Returns:
            otpauth:// URI for authenticator apps
        """
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(
            name=user_email,
            issuer_name=self.issuer_name
        )

    def generate_qr_code(self, provisioning_uri: str) -> str:
        """
        Generate QR code image from provisioning URI.
        
        Args:
            provisioning_uri: otpauth:// URI
            
        Returns:
            Base64-encoded PNG image
        """
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)
        
        img_base64 = base64.b64encode(buffer.getvalue()).decode()
        return f"data:image/png;base64,{img_base64}"

    def verify_token(self, secret: str, token: str) -> bool:
        """
        Verify a TOTP token.
        
        Args:
            secret: User's MFA secret
            token: 6-digit code from authenticator app
            
        Returns:
            True if valid, False otherwise
        """
        totp = pyotp.TOTP(secret)
        # Allow 1 window tolerance for clock drift
        return totp.verify(token, valid_window=1)

    def enable_mfa(
        self,
        db: Session,
        user: User,
    ) -> dict:
        """
        Enable MFA for a user and generate setup data.
        
        Args:
            db: Database session
            user: User to enable MFA for
            
        Returns:
            Dictionary with secret and QR code
        """
        # Generate new secret
        secret = self.generate_secret()
        
        # Store secret (encrypted in production!)
        user.mfa_secret = secret
        user.mfa_enabled = False  # Not enabled until verified
        db.add(user)
        db.commit()
        
        # Generate provisioning data
        provisioning_uri = self.get_provisioning_uri(
            user.email,
            secret
        )
        qr_code = self.generate_qr_code(provisioning_uri)
        
        # Generate recovery codes
        recovery_codes = self._generate_recovery_codes()
        user.mfa_recovery_codes = recovery_codes
        db.commit()
        
        logger.info(f"MFA setup initiated for user: {user.email}")
        
        return {
            "secret": secret,
            "qr_code": qr_code,
            "recovery_codes": recovery_codes,
            "provisioning_uri": provisioning_uri
        }

    def verify_and_enable(
        self,
        db: Session,
        user: User,
        token: str
    ) -> bool:
        """
        Verify initial setup token and enable MFA.
        
        Args:
            db: Database session
            user: User to enable MFA for
            token: Verification token
            
        Returns:
            True if verification successful
        """
        if not user.mfa_secret:
            logger.warning(
                f"MFA verification attempted without secret: {user.email}"
            )
            return False
        
        if self.verify_token(user.mfa_secret, token):
            user.mfa_enabled = True
            user.mfa_enabled_at = datetime.now(UTC)
            db.add(user)
            db.commit()
            logger.info(f"MFA enabled successfully for: {user.email}")
            return True
        
        logger.warning(
            f"MFA verification failed for: {user.email}"
        )
        return False

    def disable_mfa(
        self,
        db: Session,
        user: User
    ):
        """
        Disable MFA for a user.
        """
        user.mfa_enabled = False
        user.mfa_secret = None
        user.mfa_recovery_codes = None
        db.add(user)
        db.commit()
        logger.info(f"MFA disabled for: {user.email}")

    def verify_recovery_code(
        self,
        db: Session,
        user: User,
        code: str
    ) -> bool:
        """
        Verify and consume a recovery code.
        
        Args:
            db: Database session
            user: User attempting recovery
            code: Recovery code
            
        Returns:
            True if code valid
        """
        if not user.mfa_recovery_codes:
            return False
        
        codes = user.mfa_recovery_codes
        if code in codes:
            # Remove used code
            codes.remove(code)
            user.mfa_recovery_codes = codes
            db.add(user)
            db.commit()
            logger.info(
                f"Recovery code used for: {user.email}"
            )
            return True
        
        return False

    def _generate_recovery_codes(self, count: int = 10) -> list[str]:
        """
        Generate backup recovery codes.
        
        Args:
            count: Number of codes to generate
            
        Returns:
            List of recovery codes
        """
        import secrets
        codes = []
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = ''.join(
                secrets.choice(
                    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
                ) for _ in range(8)
            )
            codes.append(code)
        return codes


# Singleton instance
mfa_service = MFAService()
