import React from 'react';

const LOGO_URL = "https://customer-assets.emergentagent.com/job_gemini-prd-impl/artifacts/2xebkno0_image.png";

export default function AuraLogo({ size = 36, className = "" }) {
  return (
    <img
      src={LOGO_URL}
      alt="AURA"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      data-testid="aura-logo"
    />
  );
}
