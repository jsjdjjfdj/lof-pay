import { PortalConfig } from '../types';

// High-resolution clean Bangla QR code
export const DEFAULT_BANGLA_QR_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 560" width="500" height="560">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Card Background -->
  <rect x="0" y="0" width="500" height="560" rx="24" fill="#ffffff" filter="url(#shadow)"/>
  <rect x="1" y="1" width="498" height="558" rx="23" fill="none" stroke="#e2e8f0" stroke-width="2"/>

  <!-- Top Banner -->
  <path d="M 0 24 C 0 10.745 10.745 0 24 0 L 476 0 C 489.255 0 500 10.745 500 24 L 500 76 L 0 76 Z" fill="url(#headerGrad)" />
  
  <text x="250" y="48" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-weight="700" font-size="22" fill="#ffffff" text-anchor="middle">বাংলা কিউআর (BANGLA QR)</text>

  <!-- Merchant Label -->
  <text x="250" y="112" font-family="'Inter', sans-serif" font-weight="800" font-size="16" fill="#0f172a" text-anchor="middle" letter-spacing="1">LEGEND OF FIRE</text>

  <!-- QR Frame Outer -->
  <rect x="65" y="135" width="370" height="370" rx="16" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>

  <!-- QR Finder Patterns (Top-Left) -->
  <rect x="90" y="160" width="70" height="70" rx="8" fill="#0f172a"/>
  <rect x="102" y="172" width="46" height="46" rx="4" fill="#ffffff"/>
  <rect x="112" y="182" width="26" height="26" rx="2" fill="#0284c7"/>

  <!-- QR Finder Patterns (Top-Right) -->
  <rect x="340" y="160" width="70" height="70" rx="8" fill="#0f172a"/>
  <rect x="352" y="172" width="46" height="46" rx="4" fill="#ffffff"/>
  <rect x="362" y="182" width="26" height="26" rx="2" fill="#0284c7"/>

  <!-- QR Finder Patterns (Bottom-Left) -->
  <rect x="90" y="410" width="70" height="70" rx="8" fill="#0f172a"/>
  <rect x="102" y="422" width="46" height="46" rx="4" fill="#ffffff"/>
  <rect x="112" y="432" width="26" height="26" rx="2" fill="#0284c7"/>

  <!-- Stylized Matrix Blocks -->
  <g fill="#1e293b">
    <rect x="180" y="160" width="14" height="28" rx="2"/>
    <rect x="204" y="160" width="28" height="14" rx="2"/>
    <rect x="242" y="160" width="14" height="14" rx="2"/>
    <rect x="266" y="160" width="28" height="14" rx="2"/>
    <rect x="304" y="160" width="14" height="28" rx="2"/>

    <rect x="180" y="200" width="28" height="14" rx="2"/>
    <rect x="220" y="190" width="14" height="28" rx="2"/>
    <rect x="248" y="190" width="28" height="14" rx="2"/>
    <rect x="286" y="200" width="34" height="14" rx="2"/>

    <rect x="90" y="245" width="14" height="28" rx="2"/>
    <rect x="114" y="245" width="28" height="14" rx="2"/>
    <rect x="152" y="245" width="14" height="38" rx="2"/>
    <rect x="180" y="235" width="36" height="14" rx="2"/>
    <rect x="280" y="235" width="40" height="14" rx="2"/>
    <rect x="330" y="245" width="20" height="20" rx="2"/>
    <rect x="360" y="245" width="28" height="14" rx="2"/>
    <rect x="398" y="245" width="14" height="38" rx="2"/>

    <rect x="90" y="290" width="38" height="14" rx="2"/>
    <rect x="140" y="290" width="26" height="26" rx="2"/>
    <rect x="335" y="290" width="36" height="14" rx="2"/>
    <rect x="385" y="285" width="26" height="26" rx="2"/>

    <rect x="90" y="335" width="14" height="28" rx="2"/>
    <rect x="120" y="335" width="34" height="14" rx="2"/>
    <rect x="165" y="335" width="14" height="42" rx="2"/>
    <rect x="325" y="335" width="20" height="34" rx="2"/>
    <rect x="360" y="335" width="30" height="14" rx="2"/>
    <rect x="400" y="335" width="14" height="42" rx="2"/>

    <rect x="180" y="385" width="34" height="14" rx="2"/>
    <rect x="225" y="380" width="14" height="30" rx="2"/>
    <rect x="250" y="390" width="24" height="14" rx="2"/>
    <rect x="285" y="380" width="20" height="30" rx="2"/>
    <rect x="315" y="385" width="30" height="14" rx="2"/>
    <rect x="355" y="385" width="20" height="20" rx="2"/>
    <rect x="385" y="390" width="28" height="14" rx="2"/>

    <rect x="180" y="430" width="20" height="30" rx="2"/>
    <rect x="210" y="430" width="34" height="14" rx="2"/>
    <rect x="255" y="425" width="20" height="36" rx="2"/>
    <rect x="285" y="430" width="30" height="14" rx="2"/>
    <rect x="325" y="425" width="20" height="36" rx="2"/>
    <rect x="355" y="430" width="24" height="14" rx="2"/>
    <rect x="390" y="425" width="20" height="36" rx="2"/>

    <rect x="180" y="470" width="36" height="14" rx="2"/>
    <rect x="228" y="470" width="24" height="14" rx="2"/>
    <rect x="264" y="470" width="46" height="14" rx="2"/>
    <rect x="320" y="470" width="30" height="14" rx="2"/>
    <rect x="360" y="470" width="48" height="14" rx="2"/>
  </g>

  <!-- Center Emblem (Bangla QR Badge in center of QR) -->
  <rect x="210" y="280" width="80" height="80" rx="16" fill="#ffffff" stroke="#0284c7" stroke-width="3" filter="url(#shadow)"/>
  <circle cx="250" cy="312" r="18" fill="#e0f2fe"/>
  <path d="M 244 323 C 240 313 248 305 252 301 C 255 307 260 309 262 314 C 265 319 259 326 251 326 C 246 326 245 325 244 323 Z" fill="#ef4444"/>
  <circle cx="254" cy="313" r="4" fill="#f59e0b"/>
  <text x="250" y="350" font-family="'Inter', sans-serif" font-weight="900" font-size="10" fill="#0369a1" text-anchor="middle" letter-spacing="0.5">LOF PAY</text>

  <!-- Bottom Terminal text -->
  <text x="250" y="530" font-family="'Hind Siliguri', 'Segoe UI', sans-serif" font-weight="600" font-size="13" fill="#64748b" text-anchor="middle">Scan via bKash, Nagad, Rocket or Any Bank App</text>
</svg>
`)}`;

// Default 9:16 Vertical Video (Mobile Reels/Shorts format)
export const DEFAULT_VERTICAL_VIDEO_URL =
  'https://assets.mixkit.co/videos/preview/mixkit-vertical-view-of-a-neon-sign-42578-large.mp4';

export const defaultPortalConfig: PortalConfig = {
  brandName: 'LEGEND OF FIRE',
  brandSubtitle: 'Payment Portal',
  announcementText: '',
  logoUrl: '',
  qrImageUrl: DEFAULT_BANGLA_QR_DATA_URL,
  qrMerchantName: 'LEGEND OF FIRE',
  qrMerchantId: 'BANGLA-QR-LOF',
  videoUrl: DEFAULT_VERTICAL_VIDEO_URL,
  videoTitle: 'Tutorial Video',
  videoBanglaDesc: '',
  supportPhone: '',
  supportTelegram: '',
};
