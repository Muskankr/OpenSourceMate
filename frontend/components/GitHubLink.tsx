const GITHUB_REPO = "https://github.com/Muskankr/OpenSourceMate";

interface GitHubLinkProps {
  children?: React.ReactNode;
  className?: string;
  ariaLabel?: string;
}

export default function GitHubLink({
  children = "GitHub ↗",
  className = "",
  ariaLabel = "OpenSourceMate GitHub repository (opens in a new tab)",
}: GitHubLinkProps) {
  return (
    <a
      href={GITHUB_REPO}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 rounded-lg transition-colors ${className}`}
    >
      {children}
    </a>
  );
}
