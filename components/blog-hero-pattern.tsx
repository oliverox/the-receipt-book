export function BlogHeroPattern() {
  return (
    <div className="absolute inset-0 z-[-1]">
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        className="text-emerald-600/20 dark:text-emerald-400/20"
      >
        <defs>
          <pattern
            id="hero-pattern"
            x="0"
            y="0"
            width="120"
            height="120"
            patternUnits="userSpaceOnUse"
          >
            <rect x="10" y="10" width="40" height="30" rx="3" fill="currentColor" />
            <rect x="70" y="10" width="40" height="30" rx="3" fill="currentColor" />
            <rect x="10" y="50" width="40" height="30" rx="3" fill="currentColor" />
            <rect x="70" y="50" width="40" height="30" rx="3" fill="currentColor" />
            <path d="M25 20 L35 20" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M25 25 L32 25" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M85 20 L95 20" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M85 25 L92 25" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M25 60 L35 60" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M25 65 L32 65" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M85 60 L95 60" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
            <path d="M85 65 L92 65" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#hero-pattern)"
        />
      </svg>
    </div>
  );
}