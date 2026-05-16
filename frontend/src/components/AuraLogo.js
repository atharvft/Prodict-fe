import React from 'react';

const LOGO_URL = "https://static.prod-images.emergentagent.com/jobs/f4b546d4-bdf7-4ed7-97de-31eac23af15e/images/076ecd1dd75056046933c082cff8dd58ada5858038a7e00e5109289efc5eeb4d.png";

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
