import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * The extraction must stay a general watch analytics engine.
 *
 * These assertions are deliberately about coupling, not features. The engine
 * is allowed to know about media events; it is not allowed to know about a
 * player vendor, an embedded player, a playback credential, or a remote
 * media/catalog endpoint. If a future change adds one of those, this test
 * fails before the dependency reaches the measurement path.
 */

const ROOT = process.cwd();
const RUNTIME_DIRS = ["app", "engine", "server"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mjs", ".js"]);

interface ForbiddenPattern {
  label: string;
  pattern: RegExp;
}

const FORBIDDEN_SOURCE_PATTERNS: ForbiddenPattern[] = [
  {
    label: "TP Streams or another hosted player/provider",
    pattern:
      /\b(?:tp[\s_-]?streams?|jwplayer|videojs|video\.js|hls\.js|dash\.js|shaka-player|plyr|brightcove|wistia|vimeo|youtube|mux)\b/i,
  },
  {
    label: "embedded player",
    pattern: /<iframe\b/i,
  },
  {
    label: "playback credential or grant",
    pattern:
      /\b(?:playbackGrant|verifyPlaybackGrant|grantMatches|playback[\s_-]?token|PLAYBACK_TOKEN_SECRET|ANALYTICS_SIGNING_SECRET)\b/i,
  },
  {
    label: "remote media or catalog endpoint",
    pattern: /https?:\/\//i,
  },
];

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, files);
    } else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

describe("analytics engine purity", () => {
  const files = RUNTIME_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)));

  it("has source files to inspect", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it("has no player-provider, credential or remote-endpoint coupling", () => {
    const violations: string[] = [];

    for (const file of files) {
      const relative = path.relative(ROOT, file);
      const source = fs.readFileSync(file, "utf8");
      for (const rule of FORBIDDEN_SOURCE_PATTERNS) {
        if (rule.pattern.test(source)) {
          violations.push(`${relative}: ${rule.label}`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("does not ship a playback-token module", () => {
    expect(fs.existsSync(path.join(ROOT, "engine", "playback-token.ts"))).toBe(false);
  });

  it("does not pull data from a player SDK through package dependencies", () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      optionalDependencies?: Record<string, string>;
    };

    const names = Object.keys({
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
      ...(pkg.optionalDependencies ?? {}),
    });

    const playerPackages = names.filter((name) =>
      /^(?:@[^/]+\/)?(?:video\.js|videojs|jwplayer|hls\.js|dash\.js|shaka-player|plyr|brightcove|wistia|vimeo|youtube|mux)(?:$|[-/])/i.test(
        name,
      ),
    );

    expect(playerPackages).toEqual([]);
  });
});
