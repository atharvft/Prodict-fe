import React from 'react';

/**
 * Prodict SVG logo mark — the geometric "P" shape.
 *
 * The mark consists of:
 *   - A salmon/terracotta left wing (the outer-left face of the P)
 *   - A white right body (the vertical stroke + bowl of the P)
 *   - A small salmon circle (the pupil / counter of the P)
 *
 * variant="mark"      → icon only, square, used in sidebar / chat avatars
 * variant="wordmark"  → full logo with "Prodict" + tagline text
 *
 * theme="light"  → dark green text  (on light backgrounds)
 * theme="dark"   → white text       (on dark backgrounds like the login panel)
 */
export default function AuraLogo({ size = 36, variant = "mark", className = "", theme = "light" }) {
  const textColor     = theme === "dark" ? "#FFFFFF" : "#2D3B2A";
  const taglineColor  = "#C27A63"; // salmon — same on both themes

  // ── Mark SVG (the geometric P icon) ──────────────────────────────────────
  // Drawn on a 56×64 viewBox so proportions stay crisp at any size.
  const markSvg = (
    <svg
      viewBox="0 0 56 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ width: size, height: size * (64 / 56) }}
    >
      {/* Left salmon wing — trapezoid shape */}
      <path
        d="M0 12 L18 0 L18 44 L0 56 Z"
        fill="#C27A63"
      />
      {/* Right white body — tall rounded rectangle with a notch for the bowl */}
      <path
        d="M20 0 L38 8 C48 13 52 21 48 30 C44 39 34 42 24 40 L24 64 L20 64 Z"
        fill={theme === "dark" ? "#FFFFFF" : "#FFFFFF"}
      />
      {/* Inner cutout — makes the bowl "open" — same color as background */}
      <ellipse
        cx="34"
        cy="22"
        rx="9"
        ry="10"
        fill={theme === "dark" ? "#2D372B" : "#F2F0EA"}
      />
      {/* Salmon circle / dot — the "eye" of the P */}
      <circle cx="34" cy="22" r="5" fill="#C27A63" />
    </svg>
  );

  // ── Mark only ─────────────────────────────────────────────────────────────
  if (variant === "mark") {
    return (
      <div
        className={`aura-logo aura-logo-mark inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        aria-label="Prodict AI"
        data-testid="aura-logo"
      >
        {markSvg}
      </div>
    );
  }

  // ── Wordmark (mark + "Prodict" + tagline) ─────────────────────────────────
  const iconSize   = size * 1.1;
  const fontSize   = size * 1.05;
  const tagSize    = size * 0.32;

  return (
    <div
      className={`aura-logo aura-logo-wordmark inline-flex items-center gap-3 ${className}`}
      aria-label="Prodict AI"
      data-testid="aura-logo"
    >
      {/* Icon */}
      <svg
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ width: iconSize, height: iconSize * (64 / 56), flexShrink: 0 }}
      >
        <path d="M0 12 L18 0 L18 44 L0 56 Z" fill="#C27A63" />
        <path
          d="M20 0 L38 8 C48 13 52 21 48 30 C44 39 34 42 24 40 L24 64 L20 64 Z"
          fill="#FFFFFF"
        />
        <ellipse
          cx="34" cy="22" rx="9" ry="10"
          fill={theme === "dark" ? "#2D372B" : "#F2F0EA"}
        />
        <circle cx="34" cy="22" r="5" fill="#C27A63" />
      </svg>

      {/* Text block */}
      <div className="flex flex-col leading-none">
        <span
          style={{
            fontSize: fontSize,
            fontWeight: 700,
            color: textColor,
            fontFamily: "'Manrope', sans-serif",
            letterSpacing: "-0.01em",
            lineHeight: 1,
          }}
        >
          Prodict
        </span>
        <span
          style={{
            fontSize: tagSize,
            fontWeight: 500,
            color: taglineColor,
            fontFamily: "'Figtree', sans-serif",
            letterSpacing: "0.12em",
            lineHeight: 1.3,
            marginTop: "0.2em",
          }}
        >
          AI ADVISOR. BUILT FOR FOCUS.
        </span>
      </div>
    </div>
  );
}
