import type { NextConfig } from "next";

/**
 * Content Security Policy.
 *
 * The one directive that matters for this project is `media-src 'self' blob:`.
 * A local video is served from a `blob:` URL, and without `blob:` in
 * `media-src` the browser refuses to play it. The failure is silent: the
 * element shows nothing, and the only trace is a "Refused to play" line in
 * the console. The video appears broken for no visible reason.
 *
 * `connect-src` includes `ws:`/`http:` for the dev server's hot reload.
 *
 * The policy is exported so a test can assert on it. A CSP that cannot be
 * inspected drifts, and the failure it causes is invisible.
 */
const isDev = process.env.NODE_ENV !== "production";

export const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "worker-src 'self' blob:",
  "connect-src 'self'" + (isDev ? " ws://localhost:* http://localhost:*" : ""),
  // blob: is required for local video playback.
  "media-src 'self' blob: data:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Pin the tracing root to this project. Without it, a lockfile in a parent
  // directory can make Next infer the wrong workspace root.
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["node:sqlite"],
  // The engine uses explicit `.js` specifiers so it stays valid under plain
  // Node ESM. Next's bundler needs to map them back to the TypeScript source.
  webpack(config) {
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
