import base64
import hashlib
import hmac
import json
import time
from typing import Any
from contextvars import ContextVar

from app.config import get_settings
from app.utils.logging import get_logger

logger = get_logger("app.services.auth")

COOKIE_NAME = "osm_session"

# ContextVar holding the active visitor's OAuth access token for the duration of the request
current_user_github_token: ContextVar[str | None] = ContextVar(
    "current_user_github_token", default=None
)


def get_current_user_token() -> str | None:
    """Retrieve the per-request visitor GitHub OAuth token, if signed in."""
    return current_user_github_token.get()


def set_current_user_token(token: str | None) -> None:
    """Set the per-request visitor GitHub OAuth token in ContextVar."""
    current_user_github_token.set(token)


def _derive_keys(secret: str) -> tuple[bytes, bytes]:
    """Derive encryption and HMAC signing keys from the application secret_key."""
    enc_key = hashlib.sha256(f"osm-enc:{secret}".encode("utf-8")).digest()
    mac_key = hashlib.sha256(f"osm-mac:{secret}".encode("utf-8")).digest()
    return enc_key, mac_key


def _xor_cipher(data: bytes, key: bytes) -> bytes:
    """Stream keystream cipher using repeated SHA-256 blocks for fast, lightweight in-memory encryption."""
    output = bytearray(len(data))
    block_index = 0
    key_offset = 0
    keystream_block = b""

    for i in range(len(data)):
        if key_offset == len(keystream_block):
            keystream_block = hashlib.sha256(key + block_index.to_bytes(4, "big")).digest()
            block_index += 1
            key_offset = 0
        output[i] = data[i] ^ keystream_block[key_offset]
        key_offset += 1

    return bytes(output)


def create_session_token(payload: dict[str, Any], max_age_seconds: int = 86400) -> str:
    """Create a signed, encrypted session string containing payload data.
    The token expires after max_age_seconds.
    """
    settings = get_settings()
    enc_key, mac_key = _derive_keys(settings.secret_key)

    payload_copy = dict(payload)
    payload_copy["_exp"] = int(time.time()) + max_age_seconds
    raw_json = json.dumps(payload_copy).encode("utf-8")

    ciphertext = _xor_cipher(raw_json, enc_key)
    sig = hmac.new(mac_key, ciphertext, hashlib.sha256).digest()

    combined = sig + ciphertext
    return base64.urlsafe_b64encode(combined).decode("ascii")


def read_session_token(token_str: str) -> dict[str, Any] | None:
    """Decrypt and verify session token, returning payload dict or None if invalid or expired."""
    if not token_str:
        return None

    try:
        settings = get_settings()
        enc_key, mac_key = _derive_keys(settings.secret_key)

        combined = base64.urlsafe_b64decode(token_str.encode("ascii"))
        if len(combined) < 32:
            return None

        sig, ciphertext = combined[:32], combined[32:]
        expected_sig = hmac.new(mac_key, ciphertext, hashlib.sha256).digest()

        if not hmac.compare_digest(sig, expected_sig):
            return None

        raw_json = _xor_cipher(ciphertext, enc_key)
        data = json.loads(raw_json.decode("utf-8"))

        if not isinstance(data, dict):
            return None

        exp = data.get("_exp")
        if exp is not None and time.time() > exp:
            return None

        return data
    except Exception:
        return None
