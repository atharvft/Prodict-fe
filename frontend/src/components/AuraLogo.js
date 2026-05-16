import React from 'react';

const LOGO_URL = "https://static.prod-images.emergentagent.com/jobs/f4b546d4-bdf7-4ed7-97de-31eac23af15e/images/c7bbb666e7eeb914e6cabb2348b2acbd32802cce347979bece178ad63d2c6967.png";

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
