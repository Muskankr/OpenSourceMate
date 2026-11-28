"""CLI scanner and verification utility for testing OpenSourceMate security headers.

Can be run locally or against deployed instances to audit HTTP security headers:
    python scripts/verify_security_headers.py --url https://open-source-mate-tawny.vercel.app
    python scripts/verify_security_headers.py --url http://localhost:8000/api/health
"""

import argparse
import sys
from typing import NamedTuple
import httpx


class HeaderCheck(NamedTuple):
    name: str
    required: bool
    expected_value: str | None
    description: str


RECOMMENDED_HEADERS = [
    HeaderCheck(
        name="X-Content-Type-Options",
        required=True,
        expected_value="nosniff",
        description="Prevents browser MIME-type sniffing",
    ),
    HeaderCheck(
        name="X-Frame-Options",
        required=True,
        expected_value="DENY",
        description="Clickjacking protection (frame blocking)",
    ),
    HeaderCheck(
        name="Content-Security-Policy",
        required=True,
        expected_value=None,
        description="Controls origins for scripts, assets, and connections",
    ),
    HeaderCheck(
        name="Referrer-Policy",
        required=True,
        expected_value=None,
        description="Limits referrer header leakage across origins",
    ),
    HeaderCheck(
        name="Cross-Origin-Opener-Policy",
        required=False,
        expected_value="same-origin",
        description="Origin isolation from window opener contexts",
    ),
    HeaderCheck(
        name="Strict-Transport-Security",
        required=False,
        expected_value=None,
        description="Enforces HTTPS connections (production only)",
    ),
]


def audit_url(target_url: str) -> bool:
    """Audit HTTP response headers against recommended security standards."""
    print(f"Scanning target URL: {target_url}\n" + "=" * 60)
    try:
        response = httpx.get(target_url, timeout=10.0, follow_redirects=True)
    except Exception as exc:
        print(f"[!] Failed to connect to {target_url}: {exc}")
        return False

    headers_lower = {k.lower(): v for k, v in response.headers.items()}
    all_passed = True

    print(f"HTTP Status: {response.status_code}")
    print("-" * 60)

    for check in RECOMMENDED_HEADERS:
        header_key = check.name.lower()
        actual_val = headers_lower.get(header_key)

        if not actual_val:
            if check.required:
                print(f"[FAIL] Missing Required Header: {check.name}")
                print(f"       Description: {check.description}")
                all_passed = False
            else:
                print(f"[WARN] Optional Header Not Present: {check.name}")
                print(f"       Description: {check.description}")
        else:
            if check.expected_value and actual_val.lower() != check.expected_value.lower():
                print(f"[WARN] Header Value Discrepancy: {check.name}")
                print(f"       Expected: {check.expected_value}")
                print(f"       Received: {actual_val}")
            else:
                print(f"[PASS] {check.name}: {actual_val}")

    print("=" * 60)
    if all_passed:
        print("[SUCCESS] All mandatory security headers are present.")
    else:
        print("[ALERT] One or more required security headers are missing.")

    return all_passed


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit HTTP Security Headers")
    parser.add_argument("--url", required=True, help="Target URL to scan")
    args = parser.parse_args()

    success = audit_url(args.url)
    sys.exit(0 if success else 1)
