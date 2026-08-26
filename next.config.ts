import type { NextConfig } from "next";

// Collage is fully client-side and uses data:/blob: URIs for images and export,
// so the policy allows those while keeping everything else locked to self.
// React needs eval() for dev-only debugging; production stays strict.
// React needs eval() for dev-only debugging; production stays strict.
const isDev = process.env.NODE_ENV !== "production";
const scriptSrc = `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`;
const csp = [
  "default-src 'self'",
  "img-src 'self' data: blob:",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Note: no 'upgrade-insecure-requests' - HSTS preload already forces HTTPS
  // for the domain and every subresource is same-origin HTTPS, so it adds no
  // real protection while breaking http://localhost loads in WebKit.
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  devIndicators: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
