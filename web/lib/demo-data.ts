export type Metric = {
  label: string;
  value: string;
  delta: string;
  note: string;
  trend: "up" | "down" | "flat";
  spark: number[];
};

export const overviewMetrics: Metric[] = [
  {
    label: "Unique watch time",
    value: "12,482h",
    delta: "+18.4%",
    note: "vs. previous 30 days",
    trend: "up",
    spark: [22, 24, 23, 28, 27, 31, 30, 35, 34, 38, 41, 39, 44, 47],
  },
  {
    label: "Total watched",
    value: "16,304h",
    delta: "+24.1%",
    note: "1.31× per session",
    trend: "up",
    spark: [18, 22, 20, 25, 27, 26, 31, 30, 34, 36, 39, 43, 42, 48],
  },
  {
    label: "Completion rate",
    value: "68.4%",
    delta: "+4.2pt",
    note: "across 128 titles",
    trend: "up",
    spark: [30, 31, 33, 32, 35, 37, 36, 39, 38, 41, 42, 44, 43, 46],
  },
  {
    label: "Projection agreement",
    value: "99.98%",
    delta: "0.02% drift",
    note: "last audit · 4m ago",
    trend: "flat",
    spark: [50, 50, 49, 50, 50, 50, 51, 50, 50, 50, 50, 51, 50, 50],
  },
];

export type ContentRow = {
  id: string;
  title: string;
  type: "Course" | "Lesson" | "Talk" | "Webinar";
  uniqueHours: number;
  completion: number;
  rewatch: number;
  views: number;
  tone: "mint" | "sky" | "lilac" | "sand" | "graphite";
  duration: string;
  trend: number;
};

export const contentRows: ContentRow[] = [
  {
    id: "c-01",
    title: "Designing for trust",
    type: "Course",
    uniqueHours: 3284,
    completion: 78,
    rewatch: 28,
    views: 18420,
    tone: "mint",
    duration: "42:18",
    trend: 12.4,
  },
  {
    id: "c-02",
    title: "The first 90 seconds",
    type: "Lesson",
    uniqueHours: 2410,
    completion: 71,
    rewatch: 22,
    views: 14980,
    tone: "sky",
    duration: "18:04",
    trend: 8.1,
  },
  {
    id: "c-03",
    title: "Inside the write path",
    type: "Talk",
    uniqueHours: 1982,
    completion: 64,
    rewatch: 34,
    views: 11240,
    tone: "graphite",
    duration: "31:42",
    trend: 16.8,
  },
  {
    id: "c-04",
    title: "Retention, rewritten",
    type: "Webinar",
    uniqueHours: 1544,
    completion: 59,
    rewatch: 19,
    views: 9870,
    tone: "lilac",
    duration: "56:10",
    trend: -2.3,
  },
  {
    id: "c-05",
    title: "A field guide to HLS",
    type: "Course",
    uniqueHours: 1187,
    completion: 83,
    rewatch: 31,
    views: 7640,
    tone: "sand",
    duration: "27:30",
    trend: 6.7,
  },
  {
    id: "c-06",
    title: "When a projection drifts",
    type: "Talk",
    uniqueHours: 964,
    completion: 62,
    rewatch: 27,
    views: 6310,
    tone: "mint",
    duration: "24:56",
    trend: 4.5,
  },
  {
    id: "c-07",
    title: "The honest dashboard",
    type: "Lesson",
    uniqueHours: 712,
    completion: 88,
    rewatch: 16,
    views: 4980,
    tone: "sky",
    duration: "12:44",
    trend: 9.2,
  },
];

export type Session = {
  id: string;
  viewer: string;
  initials: string;
  content: string;
  started: string;
  device: "Desktop" | "Mobile" | "Tablet";
  duration: string;
  watched: string;
  claimed: string;
  completion: number;
  rewatch: number;
  status: "Verified" | "Repaired" | "Deduped";
  country: string;
  ranges: [number, number][];
  events: { time: string; event: string; detail: string }[];
};

export const sessions: Session[] = [
  {
    id: "S-8841",
    viewer: "Maya Chen",
    initials: "MC",
    content: "Designing for trust",
    started: "Today, 10:42",
    device: "Desktop",
    duration: "42:18",
    watched: "38:12",
    claimed: "41:08",
    completion: 90,
    rewatch: 14,
    status: "Verified",
    country: "United Kingdom",
    ranges: [
      [0, 540],
      [602, 1092],
      [1180, 1680],
      [1740, 2502],
    ],
    events: [
      { time: "10:42:03", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "10:51:02", event: "timeupdate", detail: "segment 0–540 · wallClock 539s" },
      { time: "10:51:24", event: "seeking", detail: "from 540 to 602 · rate 1.0" },
      { time: "10:53:11", event: "ratechange", detail: "1.0 → 1.25" },
      { time: "11:01:20", event: "timeupdate", detail: "segment 602–1092 · wallClock 488s" },
      { time: "11:08:47", event: "pause", detail: "segment 1180–1680 · wallClock 500s" },
      { time: "11:09:12", event: "playing", detail: "resume · rate 1.25" },
      { time: "11:22:08", event: "ended", detail: "last segment 1740–2502" },
    ],
  },
  {
    id: "S-8838",
    viewer: "Daniel Okafor",
    initials: "DO",
    content: "Inside the write path",
    started: "Today, 10:18",
    device: "Mobile",
    duration: "31:42",
    watched: "24:06",
    claimed: "26:40",
    completion: 76,
    rewatch: 22,
    status: "Deduped",
    country: "Nigeria",
    ranges: [
      [0, 412],
      [470, 882],
      [960, 1410],
      [1440, 1612],
    ],
    events: [
      { time: "10:18:12", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "10:25:04", event: "timeupdate", detail: "segment 0–412 · wallClock 411s" },
      { time: "10:26:03", event: "offline", detail: "outbox mirrored to IndexedDB" },
      { time: "10:28:44", event: "retry", detail: "duplicate batch · idempotency key reused" },
      { time: "10:29:03", event: "accepted", detail: "duplicate=3 rejected=0" },
      { time: "10:39:11", event: "pause", detail: "segment 960–1410 · wallClock 449s" },
      { time: "10:42:31", event: "ended", detail: "last segment 1440–1612" },
    ],
  },
  {
    id: "S-8831",
    viewer: "Sofia Reyes",
    initials: "SR",
    content: "The first 90 seconds",
    started: "Today, 09:54",
    device: "Tablet",
    duration: "18:04",
    watched: "16:58",
    claimed: "16:58",
    completion: 94,
    rewatch: 8,
    status: "Verified",
    country: "Spain",
    ranges: [
      [0, 560],
      [560, 1018],
    ],
    events: [
      { time: "09:54:02", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "10:03:22", event: "timeupdate", detail: "segment 0–560" },
      { time: "10:11:56", event: "ended", detail: "segment 560–1018" },
    ],
  },
  {
    id: "S-8824",
    viewer: "Arjun Mehta",
    initials: "AM",
    content: "Retention, rewritten",
    started: "Today, 09:21",
    device: "Desktop",
    duration: "56:10",
    watched: "31:44",
    claimed: "35:12",
    completion: 57,
    rewatch: 12,
    status: "Repaired",
    country: "India",
    ranges: [
      [0, 180],
      [220, 610],
      [770, 1290],
      [1450, 2314],
    ],
    events: [
      { time: "09:21:04", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "09:24:04", event: "timeupdate", detail: "segment 0–180" },
      { time: "09:26:41", event: "pause", detail: "segment 220–610" },
      { time: "09:42:18", event: "seeked", detail: "segment 770–1290" },
      { time: "09:53:44", event: "ended", detail: "last segment 1450–2314" },
      { time: "09:55:02", event: "audit", detail: "projection delta +2s · repaired" },
    ],
  },
  {
    id: "S-8818",
    viewer: "Elena Petrova",
    initials: "EP",
    content: "A field guide to HLS",
    started: "Today, 08:47",
    device: "Mobile",
    duration: "27:30",
    watched: "25:52",
    claimed: "26:10",
    completion: 94,
    rewatch: 6,
    status: "Verified",
    country: "Germany",
    ranges: [[0, 1552]],
    events: [
      { time: "08:47:09", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "09:12:51", event: "ended", detail: "segment 0–1552" },
    ],
  },
  {
    id: "S-8812",
    viewer: "Noah Williams",
    initials: "NW",
    content: "When a projection drifts",
    started: "Yesterday, 22:06",
    device: "Desktop",
    duration: "24:56",
    watched: "18:20",
    claimed: "19:44",
    completion: 74,
    rewatch: 18,
    status: "Verified",
    country: "United States",
    ranges: [
      [0, 310],
      [380, 690],
      [820, 1300],
    ],
    events: [
      { time: "22:06:11", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "22:12:44", event: "timeupdate", detail: "segment 0–310" },
      { time: "22:18:02", event: "seeking", detail: "segment 380–690" },
      { time: "22:24:53", event: "ended", detail: "last segment 820–1300" },
    ],
  },
  {
    id: "S-8804",
    viewer: "Amara Ndlovu",
    initials: "AN",
    content: "The honest dashboard",
    started: "Yesterday, 21:32",
    device: "Mobile",
    duration: "12:44",
    watched: "11:46",
    claimed: "11:46",
    completion: 92,
    rewatch: 4,
    status: "Verified",
    country: "South Africa",
    ranges: [[0, 706]],
    events: [
      { time: "21:32:16", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "21:44:07", event: "ended", detail: "segment 0–706" },
    ],
  },
  {
    id: "S-8797",
    viewer: "Liam Fischer",
    initials: "LF",
    content: "Designing for trust",
    started: "Yesterday, 19:14",
    device: "Tablet",
    duration: "42:18",
    watched: "21:06",
    claimed: "23:18",
    completion: 50,
    rewatch: 9,
    status: "Deduped",
    country: "Netherlands",
    ranges: [
      [0, 410],
      [540, 780],
      [980, 1596],
    ],
    events: [
      { time: "19:14:04", event: "play", detail: "startSecond 0 · rate 1.0" },
      { time: "19:21:01", event: "pause", detail: "segment 0–410" },
      { time: "19:26:28", event: "retry", detail: "duplicate batch · request id kept" },
      { time: "19:40:12", event: "pause", detail: "last segment 980–1596" },
    ],
  },
];

export const qualityChecks = [
  { label: "Projection agreement", value: "99.98%", detail: "2s delta across 12,482h", status: "pass" },
  { label: "Unique index integrity", value: "0 conflicts", detail: "2,184,309 evidence rows", status: "pass" },
  { label: "Duplicate attempts blocked", value: "1,284", detail: "last 30 days", status: "pass" },
  { label: "Orphaned projections", value: "0", detail: "subjects reconciled", status: "pass" },
  { label: "Outbox backlog", value: "0 rows", detail: "projector caught up", status: "pass" },
  { label: "Reconciliation lag", value: "42ms", detail: "p95 over 7 days", status: "watch" },
];

export const chapterCompletion = [
  { label: "Opening", value: 96 },
  { label: "The problem", value: 88 },
  { label: "The evidence", value: 74 },
  { label: "The repair", value: 51 },
  { label: "The close", value: 69 },
];

export const deviceSplit = [
  { label: "Desktop", value: 54, color: "#0A0A0A" },
  { label: "Mobile", value: 38, color: "#30A66D" },
  { label: "Tablet", value: 8, color: "#CDEAF2" },
];

export const geography = [
  { label: "India", value: 34 },
  { label: "United States", value: 28 },
  { label: "United Kingdom", value: 12 },
  { label: "Germany", value: 9 },
  { label: "Other", value: 17 },
];

export const auditSteps = [
  { label: "Snapshot evidence log", detail: "2.18M ranges read", time: "0.8s" },
  { label: "Recompute subject totals", detail: "12,482 subjects", time: "1.4s" },
  { label: "Diff against projection", detail: "2s across 3 subjects", time: "0.2s" },
  { label: "Write bounded repair", detail: "3 rows · resumable pages", time: "0.3s" },
  { label: "Verify after repair", detail: "delta 0.00%", time: "0.4s" },
];

export function buildWatchSeries(days: number) {
  const labels: { date: string; label: string; unique: number; repeat: number; engaged: number }[] = [];
  const now = new Date("2026-11-05T00:00:00Z");
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(now.getUTCDate() - i);
    const t = days - 1 - i;
    const weekday = d.getUTCDay();
    const weekend = weekday === 0 || weekday === 6 ? 0.76 : 1;
    const base =
      318 +
      Math.sin(t / 2.6) * 34 +
      Math.sin(t / 5.2 + 1.2) * 22 +
      Math.cos(t / 1.4) * 9 +
      (t / Math.max(days, 1)) * 58;
    const unique = Math.round(base * weekend);
    const repeat = Math.round(unique * (0.24 + (Math.sin(t / 3.1) + 1) * 0.024));
    const engaged = Math.round(unique * (0.72 + (Math.cos(t / 4) + 1) * 0.035));
    labels.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      unique,
      repeat,
      engaged,
    });
  }
  return labels;
}
