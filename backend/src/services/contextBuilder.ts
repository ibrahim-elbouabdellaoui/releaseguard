import path from "path";
import fs from "fs";
import { AnalysisContext, ParsedDiffFile } from "../types/report";

const DEMO_PROJECT_DIR = path.resolve(__dirname, "../../../demo-project");

interface ChangeMeta {
  title?: string;
  author?: string;
  date?: string;
  description?: string;
  prDescription?: string;
}

/**
 * Assembles the full analysis context JSON that the Bob Release-Readiness Skill consumes.
 * Reads the test inventory and dependency manifest from the demo project.
 */
export function buildContext(
  changeId: string,
  rawDiff: string,
  parsedDiff: ParsedDiffFile[],
  meta: ChangeMeta
): AnalysisContext {
  const testInventory = collectTestInventory();
  const dependencyManifest = collectDependencyManifest(rawDiff);

  return {
    changeId,
    meta: {
      title: meta.title ?? changeId,
      author: meta.author ?? "unknown",
      date: meta.date ?? new Date().toISOString(),
      description: meta.description ?? "",
      prDescription: meta.prDescription,
    },
    diff: rawDiff,
    parsedDiff,
    testInventory,
    dependencyManifest,
  };
}

/**
 * Walks demo-project/tests/ and returns relative test file paths.
 */
function collectTestInventory(): string[] {
  const testsDir = path.join(DEMO_PROJECT_DIR, "tests");
  if (!fs.existsSync(testsDir)) return [];

  const files: string[] = [];
  walkDir(testsDir, (filePath) => {
    if (
      filePath.endsWith(".test.ts") ||
      filePath.endsWith(".spec.ts") ||
      filePath.endsWith(".test.js") ||
      filePath.endsWith(".spec.js")
    ) {
      files.push(path.relative(DEMO_PROJECT_DIR, filePath).replace(/\\/g, "/"));
    }
  });
  return files;
}

/**
 * Extracts before/after dependency versions from the diff (package.json section).
 * Falls back to reading the current package.json.
 */
function collectDependencyManifest(rawDiff: string): {
  before: Record<string, string>;
  after: Record<string, string>;
} {
  // Attempt to extract dependency changes from the diff
  const before: Record<string, string> = {};
  const after: Record<string, string> = {};

  const depPattern = /^([+-])\s+"([^"]+)":\s+"([^"]+)"/gm;
  let match: RegExpExecArray | null;

  while ((match = depPattern.exec(rawDiff)) !== null) {
    const [, sign, pkg, version] = match;
    if (sign === "-") {
      before[pkg] = version;
    } else if (sign === "+") {
      after[pkg] = version;
    }
  }

  // Fall back to reading current package.json if no diff data found
  if (Object.keys(before).length === 0 && Object.keys(after).length === 0) {
    const pkgPath = path.join(DEMO_PROJECT_DIR, "package.json");
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      Object.assign(after, allDeps);
    }
  }

  return { before, after };
}

function walkDir(dir: string, callback: (filePath: string) => void): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else {
      callback(fullPath);
    }
  }
}
