"""
Database Field Encryption Utility
Provides AES-256 encryption for sensitive database fields.
"""

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from cryptography.hazmat.backends import default_backend
import base64
import os
from typing import Optional


class FieldEncryption:
    """
    Handles encryption/decryption of sensitive database fields.
    Uses AES-256 via Fernet (symmetric encryption).
    """

    def __init__(self, secret_key: Optional[str] = None):
        """
        Args:
            secret_key: Base secret for encryption (from env var)
        """
        # Get secret from environment or use provided
        self.secret = (secret_key or os.getenv("ENCRYPTION_SECRET", "")).encode()

        if not self.secret:
            raise ValueError(
                "ENCRYPTION_SECRET must be set in environment variables"
            )

        # Derive encryption key using PBKDF2
        kdf = PBKDF2(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b'zenith_salt_v1',  # In production, use random salt per field
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.secret))
        self.cipher = Fernet(key)

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a

 plaintext string.

        Args:
            plaintext: The sensitive data to encrypt

        Returns:
            Base64-encoded encrypted string
        """
        if not plaintext:
            return ""

        encrypted_bytes = self.cipher.encrypt(plaintext.encode())
        return encrypted_bytes.decode('utf-8')

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            ciphertext: The encrypted data

        Returns:
            Original plaintext string
        """
        if not ciphertext:
            return ""

        try:
            decrypted_bytes = self.cipher.decrypt(ciphertext.encode())
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            raise ValueError(f"Decryption failed: {e}")

    def rotate_key(self, new_secret: str) -> 'FieldEncryption':
        """
        Create a new encryptor with a rotated key.
        Used for key rotation: decrypt with old key, encrypt with new key.

        Args:
            new_secret: New encryption secret

        Returns:
            New FieldEncryption instance with new key
        """
        return FieldEncryption(secret_key=new_secret)


# Global encryption instance
_encryptor: Optional[FieldEncryption] = None


def get_encryptor() -> FieldEncryption:
    """Get or create global encryption instance"""
    global _encryptor
    if _encryptor is None:
        _encryptor = FieldEncryption()
    return _encryptor


def encrypt_field(value: str) -> str:
    """Convenience function to encrypt a field"""
    return get_encryptor().encrypt(value)


def decrypt_field(value: str) -> str:
    """Convenience function to decrypt a field"""
    return get_encryptor().decrypt(value)


# Example usage in models:
"""
from sqlmodel import SQLModel, Field
from app.core.field_encryption import encrypt_field, decrypt_field

class Entity(SQLModel, table=True):
    tax_id_encrypted: str = Field(default="")

    @property
    def tax_id(self) -> str:
        return decrypt_field(self.tax_id_encrypted)

    @tax_id.setter
    def tax_id(self, value: str):
        self.tax_id_encrypted = encrypt_field(value)
"""
