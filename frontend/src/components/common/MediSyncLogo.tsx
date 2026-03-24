import React from "react";

interface MediSyncLogoProps {
  size?: number;
  className?: string;
  /** Show only the outer ring (used by DataLoader) */
  ringOnly?: boolean;
  /** Render each inner icon as a separately targetable group (for animation) */
  animatable?: boolean;
}

/**
 * Pre-computed gear notch positions (avoids hydration mismatch from Math.cos/sin).
 * 8 notches at 0°, 45°, 90°, ..., 315° around radius=82, inner=68
 */
const GEAR_NOTCHES = [
  { lx: "176.27", ly: "83.77", ix: "168", iy: "100", rx: "176.27", ry: "116.23" },
  { lx: "153.69", ly: "42.84", ix: "148.09", iy: "51.92", rx: "161.51", ry: "53.76" },
  { lx: "116.23", ly: "23.73", ix: "100", iy: "32", rx: "118.72", ry: "18.06" },
  { lx: "53.76", ly: "38.49", ix: "51.92", iy: "51.92", rx: "82.31", ry: "18.06" },
  { lx: "23.73", ly: "83.77", ix: "32", iy: "100", rx: "38.49", ry: "53.76" },
  { lx: "38.49", ly: "146.24", ix: "51.92", iy: "148.09", rx: "23.73", ry: "116.23" },
  { lx: "83.77", ly: "176.27", ix: "100", iy: "168", rx: "53.76", ry: "161.51" },
  { lx: "146.24", ly: "161.51", ix: "148.09", iy: "148.09", rx: "116.23", ry: "176.27" },
];

/**
 * MediSync Logo — SVG recreation of the favicon
 *
 * Composed of:
 *   - Outer gear ring (blue-to-teal gradient segments)
 *   - 4 inner icons: Clock, Calendar, Patient Calendar, Checkmark
 *
 * Each element has a data-logo-part attribute for CSS targeting.
 */
export default function MediSyncLogo({
  size = 120,
  className = "",
  ringOnly = false,
  animatable = false,
}: MediSyncLogoProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="MediSync Logo"
      role="img"
    >
      <defs>
        {/* Gradient for outer ring segments */}
        <linearGradient id="ms-g1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E4A9E" />
          <stop offset="100%" stopColor="#2B76C2" />
        </linearGradient>
        <linearGradient id="ms-g2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2B76C2" />
          <stop offset="100%" stopColor="#40A8C4" />
        </linearGradient>
        <linearGradient id="ms-g3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#40A8C4" />
          <stop offset="100%" stopColor="#5CC8C1" />
        </linearGradient>
        <linearGradient id="ms-g4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5CC8C1" />
          <stop offset="100%" stopColor="#9DE4D0" />
        </linearGradient>
        <linearGradient id="ms-g5" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#9DE4D0" />
          <stop offset="100%" stopColor="#40A8C4" />
        </linearGradient>
        <linearGradient id="ms-g6" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#40A8C4" />
          <stop offset="100%" stopColor="#1E4A9E" />
        </linearGradient>
      </defs>

      {/* ── Outer Gear Ring ── */}
      <g data-logo-part="ring">
        {/* Ring arc segments */}
        <path d="M100 12 C108 12, 116 14, 123 17 L118 35 C112 32, 106 30, 100 30 L100 12Z" fill="url(#ms-g1)" />
        <path d="M123 17 C138 24, 150 34, 159 47 L143 56 C136 46, 127 38, 118 35 L123 17Z" fill="url(#ms-g1)" />
        <path d="M159 47 C167 59, 173 73, 175 87 L156 89 C155 78, 151 67, 143 56 L159 47Z" fill="url(#ms-g2)" />
        <path d="M175 87 C177 95, 178 103, 176 112 L158 109 C159 103, 158 96, 156 89 L175 87Z" fill="url(#ms-g2)" />
        <path d="M176 112 C173 125, 167 137, 158 147 L144 136 C150 129, 155 120, 158 109 L176 112Z" fill="url(#ms-g3)" />
        <path d="M158 147 C149 157, 138 164, 126 170 L120 153 C130 148, 138 142, 144 136 L158 147Z" fill="url(#ms-g3)" />
        <path d="M126 170 C114 175, 107 177, 100 178 L100 159 C106 158, 113 156, 120 153 L126 170Z" fill="url(#ms-g4)" />
        <path d="M100 178 C93 177, 86 175, 74 170 L80 153 C87 156, 94 158, 100 159 L100 178Z" fill="url(#ms-g4)" />
        <path d="M74 170 C62 164, 51 157, 42 147 L56 136 C62 142, 70 148, 80 153 L74 170Z" fill="url(#ms-g5)" />
        <path d="M42 147 C33 137, 27 125, 24 112 L42 109 C45 120, 50 129, 56 136 L42 147Z" fill="url(#ms-g5)" />
        <path d="M24 112 C22 103, 22 95, 24 87 L44 89 C42 96, 41 103, 42 109 L24 112Z" fill="url(#ms-g6)" />
        <path d="M24 87 C27 73, 33 59, 41 47 L57 56 C49 67, 45 78, 44 89 L24 87Z" fill="url(#ms-g6)" />
        <path d="M41 47 C50 34, 62 24, 77 17 L82 35 C73 38, 64 46, 57 56 L41 47Z" fill="url(#ms-g1)" />
        <path d="M77 17 C84 14, 92 12, 100 12 L100 30 C94 30, 88 32, 82 35 L77 17Z" fill="url(#ms-g2)" />

        {/* Gear notches — static pre-computed coordinates */}
        {GEAR_NOTCHES.map((n, i) => (
          <polygon
            key={i}
            points={`${n.lx},${n.ly} ${n.ix},${n.iy} ${n.rx},${n.ry}`}
            fill="white"
          />
        ))}
      </g>

      {/* ── Inner Icons (only if not ringOnly) ── */}
      {!ringOnly && (
        <g data-logo-part="icons">
          {/* Icon 1: Clock (Deep Navy) */}
          <g
            data-logo-part="icon-clock"
            className={animatable ? "medisync-icon-1" : undefined}
          >
            <rect x="58" y="72" width="28" height="28" rx="5" fill="#1E4A9E" />
            <circle cx="72" cy="86" r="9" fill="none" stroke="white" strokeWidth="1.8" />
            <line x1="72" y1="86" x2="72" y2="80" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="72" y1="86" x2="77" y2="86" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
          </g>

          {/* Icon 2: Calendar (Teal Blue) */}
          <g
            data-logo-part="icon-calendar"
            className={animatable ? "medisync-icon-2" : undefined}
          >
            <rect x="78" y="68" width="26" height="26" rx="4" fill="#40A8C4" />
            <line x1="84" y1="66" x2="84" y2="72" stroke="#40A8C4" strokeWidth="2" strokeLinecap="round" />
            <line x1="98" y1="66" x2="98" y2="72" stroke="#40A8C4" strokeWidth="2" strokeLinecap="round" />
            <rect x="82" y="76" width="4" height="3" rx="0.5" fill="white" />
            <rect x="88" y="76" width="4" height="3" rx="0.5" fill="white" />
            <rect x="94" y="76" width="4" height="3" rx="0.5" fill="white" />
            <rect x="82" y="81" width="4" height="3" rx="0.5" fill="white" />
            <rect x="88" y="81" width="4" height="3" rx="0.5" fill="white" />
            <rect x="94" y="81" width="4" height="3" rx="0.5" fill="white" />
            <rect x="82" y="86" width="4" height="3" rx="0.5" fill="white" />
            <rect x="88" y="86" width="4" height="3" rx="0.5" fill="white" />
          </g>

          {/* Icon 3: Patient Calendar (Ocean Blue) */}
          <g
            data-logo-part="icon-patient"
            className={animatable ? "medisync-icon-3" : undefined}
          >
            <rect x="97" y="72" width="26" height="26" rx="4" fill="#2B76C2" />
            <line x1="103" y1="70" x2="103" y2="76" stroke="#2B76C2" strokeWidth="2" strokeLinecap="round" />
            <line x1="117" y1="70" x2="117" y2="76" stroke="#2B76C2" strokeWidth="2" strokeLinecap="round" />
            <line x1="101" y1="79" x2="119" y2="79" stroke="white" strokeWidth="1" opacity="0.5" />
            <circle cx="110" cy="85" r="3" fill="white" />
            <path d="M105 94 C105 90 115 90 115 94" fill="white" />
          </g>

          {/* Icon 4: Checkmark (Action Green) */}
          <g
            data-logo-part="icon-check"
            className={animatable ? "medisync-icon-4" : undefined}
          >
            <rect x="115" y="78" width="24" height="24" rx="4" fill="#6BCB77" />
            <polyline
              points="122,90 128,96 136,84"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </g>
      )}
    </svg>
  );
}
