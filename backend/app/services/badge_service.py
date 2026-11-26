"""SVG Badge Service for OpenSourceMate.

Generates Shields.io-compatible SVG badges listing a contributor's top detected skills.
Ensures XML/SVG escaping to prevent markup injection, computes dynamic text widths,
and supports neutral fallback badges for unknown users.
"""

import html
import re
from typing import Any

# Color palette presets
DEFAULT_LABEL_BG = "#1e293b"  # Slate-800
DEFAULT_VALUE_BG = "#7c3aed"  # Vibrant purple
NEUTRAL_VALUE_BG = "#64748b"  # Neutral slate-500
SUCCESS_VALUE_BG = "#059669"  # Emerald-600


def sanitize_svg_text(value: Any) -> str:
    """Strip XML control characters and escape special characters for safe SVG embedding."""
    if value is None:
        return ""
    text = str(value)
    # Remove XML 1.0 forbidden characters:
    cleaned = re.sub(
        r"[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\U00010000-\U0010FFFF]",
        "",
        text,
    )
    # HTML/XML entity escape: < > & " '
    return html.escape(cleaned, quote=True)


def estimate_text_width(text: str, font_size: int = 11) -> int:
    """Estimate visual text width in pixels for standard sans-serif / Verdana font at 11px."""
    if not text:
        return 0

    width = 0.0
    for ch in text:
        if ch in "WM@#%&Q•":
            width += 8.6
        elif ch in "ijlI .,:;!'\"|()[]{}1":
            width += 3.8
        elif ch in "mw":
            width += 7.8
        elif ch.isupper():
            width += 7.2
        elif ch in "fkt":
            width += 5.2
        else:
            width += 6.5

    # Scale relative to 11px base
    scale = font_size / 11.0
    return max(10, int(round(width * scale)))


def generate_badge_svg(
    label: str,
    value: str,
    label_bg: str = DEFAULT_LABEL_BG,
    value_bg: str = DEFAULT_VALUE_BG,
) -> str:
    """Generate a crisp, accessible, Shields.io-compatible SVG badge.

    Args:
        label: Left-side label text (e.g. "OpenSourceMate" or "skills").
        value: Right-side value text (e.g. "Python • TypeScript • Rust").
        label_bg: Hex or CSS color for label background.
        value_bg: Hex or CSS color for value background.

    Returns:
        Complete standalone SVG XML string.
    """
    clean_label = sanitize_svg_text(label.strip())
    clean_value = sanitize_svg_text(value.strip())

    # Calculate widths
    label_text_width = estimate_text_width(label.strip())
    value_text_width = estimate_text_width(value.strip())

    left_pad = 12
    right_pad = 12
    left_width = label_text_width + (left_pad * 2)
    right_width = value_text_width + (right_pad * 2)
    total_width = left_width + right_width

    # Positions multiplied by 10 for font-size=110 transform scale(.1) subpixel accuracy
    left_x = int((left_width / 2.0) * 10)
    right_x = int((left_width + (right_width / 2.0)) * 10)
    left_text_len = label_text_width * 10
    right_text_len = value_text_width * 10

    # Ensure background colors are sanitized hex/safe strings
    safe_label_bg = sanitize_svg_text(label_bg) if re.match(r"^#[0-9a-fA-F]{3,8}$", label_bg) else DEFAULT_LABEL_BG
    safe_value_bg = sanitize_svg_text(value_bg) if re.match(r"^#[0-9a-fA-F]{3,8}$", value_bg) else DEFAULT_VALUE_BG

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{total_width}" height="20" role="img" aria-label="{clean_label}: {clean_value}">
  <title>{clean_label}: {clean_value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="{total_width}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="{left_width}" height="20" fill="{safe_label_bg}"/>
    <rect x="{left_width}" width="{right_width}" height="20" fill="{safe_value_bg}"/>
    <rect width="{total_width}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="{left_x}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{left_text_len}">{clean_label}</text>
    <text x="{left_x}" y="140" transform="scale(.1)" fill="#fff" textLength="{left_text_len}">{clean_label}</text>
    <text aria-hidden="true" x="{right_x}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="{right_text_len}">{clean_value}</text>
    <text x="{right_x}" y="140" transform="scale(.1)" fill="#fff" textLength="{right_text_len}">{clean_value}</text>
  </g>
</svg>"""
    return svg


def generate_neutral_badge_svg(
    label: str = "OpenSourceMate",
    message: str = "Skills • Not Found",
) -> str:
    """Generate a neutral badge when the requested user is unknown or has no detected skills."""
    return generate_badge_svg(
        label=label,
        value=message,
        label_bg=DEFAULT_LABEL_BG,
        value_bg=NEUTRAL_VALUE_BG,
    )
