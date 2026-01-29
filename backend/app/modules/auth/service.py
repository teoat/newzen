import pyotp
from typing import Optional


class MFAService:
    @staticmethod
    def generate_secret() -> str:
        """Generate a new random base32 secret"""
        return pyotp.random_base32()

    @staticmethod
    def get_totp_uri(secret: str, username: str, issuer_name: str = "Zenith Forensic") -> str:
        """Get the provisioning URI for QR code generation"""
        return pyotp.totp.TOTP(secret).provisioning_uri(name=username, issuer_name=issuer_name)

    @staticmethod
    def verify_totp(secret: str, token: str) -> bool:
        """Verify a TOTP token against a secret"""
        if not secret:
            return False
        totp = pyotp.TOTP(secret)
        return totp.verify(token)

    @staticmethod
    def get_current_token(secret: str) -> Optional[str]:
        """Get the current valid token (for testing/debug)"""
        if not secret:
            return None
        return pyotp.TOTP(secret).now()

    @staticmethod
    def generate_backup_codes(count: int = 10) -> list[str]:
        """Generate static backup codes for recovery"""
        import secrets

        return [secrets.token_hex(4).upper() for _ in range(count)]
