"""SVG Skill Badge generator for OpenSourceMate.

Generates embeddable, compact SVG badges suitable for GitHub profile READMEs.
Guarantees XML-safe user data escaping and resilient error fallbacks.
"""

import html
from typing import Sequence


def approximate_text_width(text: str, font_size: int = 11) -> int:
    """Approximate the pixel width of rendered text using standard sans-serif proportions."""
    # Average width factor for system sans-serif fonts at 11px is ~6.2px per character
    # Certain narrow chars (i, l, 1, ., |, space) are narrower, wide chars (m, w, @, %) wider.
    width = 0.0
    for char in text:
        if char in "ijl|!.,:;' ":
            width += 0.35 * font_size
        elif char in "mwMW@%":
            width += 0.85 * font_size
        elif char.isupper():
            width += 0.65 * font_size
        else:
            width += 0.55 * font_size
    return max(20, int(width + 4))


def generate_skill_badge_svg(
    username: str,
    skills: Sequence[str] | None = None,
    error_message: str | None = None,
    theme: str = "dark",
) -> str:
    """Generate an embeddable SVG skill badge.

    Args:
        username: Target GitHub username (will be XML-escaped).
        skills: List of top skill names (up to 3 will be used).
        error_message: If provided, renders a neutral fallback badge.
        theme: "dark" (default) or "light".

    Returns:
        Clean, valid SVG string.
    """
    safe_username = html.escape(username, quote=True)

    # Determine status and right-hand label
    is_error = error_message is not None or not skills

    if error_message:
        status_text = error_message
        badge_color = "#6e7681"  # Neutral GitHub gray
    elif not skills:
        status_text = "no public skills"
        badge_color = "#6e7681"
    else:
        # Take top 3 skills
        top_skills = [s.strip() for s in skills[:3] if s and s.strip()]
        status_text = " • ".join(top_skills) if top_skills else "no public skills"
        badge_color = "#7c3aed"  # Vibrant purple theme

    safe_status = html.escape(status_text, quote=True)
    label_text = "OpenSourceMate"

    # Compute layout dimensions (standard compact badge: height 20px, radius 3px)
    label_width = approximate_text_width(label_text, font_size=11) + 16
    status_width = approximate_text_width(status_text, font_size=11) + 16
    total_width = label_width + status_width
    height = 20

    left_bg = "#1f242c" if theme == "dark" else "#24292f"
    text_color = "#ffffff"

    label_x = label_width / 2.0
    status_x = label_width + (status_width / 2.0)

    # Accessible description
    accessible_label = f"OpenSourceMate skill badge for {safe_username}: {safe_status}"

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="{total_width}" height="{height}" role="img" aria-label="{accessible_label}">
  <title>{accessible_label}</title>
  <linearGradient id="osm-badge-glow" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="osm-badge-clip">
    <rect width="{total_width}" height="{height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#osm-badge-clip)">
    <rect width="{label_width}" height="{height}" fill="{left_bg}"/>
    <rect x="{label_width}" width="{status_width}" height="{height}" fill="{badge_color}"/>
    <rect width="{total_width}" height="{height}" fill="url(#osm-badge-glow)"/>
  </g>
  <g fill="{text_color}" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="{label_x}" y="15" fill="#010101" fill-opacity=".3">{label_text}</text>
    <text x="{label_x}" y="14" fill="{text_color}">{label_text}</text>
    <text aria-hidden="true" x="{status_x}" y="15" fill="#010101" fill-opacity=".3" font-weight="600">{safe_status}</text>
    <text x="{status_x}" y="14" fill="{text_color}" font-weight="600">{safe_status}</text>
  </g>
</svg>"""

    return svg.strip()
