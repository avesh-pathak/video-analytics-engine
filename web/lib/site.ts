export const site = {
  name: "Watchline",
  category: "Video analytics engine",
  description:
    "Watchline turns untrusted playback events into watch time your team can stand behind. Recomputed, idempotent, and repairable by design.",
  url: "https://avesh.tech",
  links: {
    github: "https://github.com/avesh-pathak/video-analytics-engine",
    linkedin: "https://www.linkedin.com/in/avesh-pathak/",
    portfolio: "https://avesh.tech",
    email: "mailto:iamaveshpathak@gmail.com",
  },
  nav: [
    { label: "Product", href: "/#product" },
    { label: "Architecture", href: "/architecture" },
    { label: "FAQ", href: "/#faq" },
  ],
  footer: {
    product: [
      { label: "Overview", href: "/#product" },
      { label: "Metrics", href: "/#metrics" },
      { label: "Architecture", href: "/architecture" },
      { label: "FAQ", href: "/#faq" },
    ],
    engine: [
      { label: "Watch math", href: "/architecture#watch-math" },
      { label: "Message layer", href: "/architecture#messages" },
      { label: "Idempotency", href: "/architecture#write-path" },
      { label: "Repair engine", href: "/architecture#repair" },
      { label: "Failure matrix", href: "/architecture#failures" },
      { label: "GitHub", href: "https://github.com/avesh-pathak/video-analytics-engine" },
    ],
    connect: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/avesh-pathak/" },
      { label: "Portfolio", href: "https://avesh.tech" },
      { label: "Email", href: "mailto:iamaveshpathak@gmail.com" },
    ],
  },
} as const;

export const mediaEvents = [
  "play",
  "playing",
  "timeupdate",
  "pause",
  "seeking",
  "seeked",
  "ratechange",
  "ended",
  "waiting",
  "stalled",
] as const;

export const playerChips = [
  "HTML5 video",
  "HLS.js",
  "Video.js",
  "Shaka Player",
  "Plyr",
  "React Player",
  "JW Player",
  "Bitmovin",
  "Any media element",
] as const;
