import { ParsedDiffFile, DiffHunk } from "../types/report";

/**
 * Parses a unified diff string into structured per-file chunks.
 *
 * Handles standard unified diff format:
 *   diff --git a/... b/...
 *   --- a/...
 *   +++ b/...
 *   @@ ... @@
 *   +added line
 *   -removed line
 *    context line
 */
export function parseDiff(rawDiff: string): ParsedDiffFile[] {
  const files: ParsedDiffFile[] = [];
  const lines = rawDiff.split("\n");

  let currentFile: ParsedDiffFile | null = null;
  let currentHunk: DiffHunk | null = null;

  for (const line of lines) {
    // New file section
    if (line.startsWith("diff --git ")) {
      if (currentFile) {
        if (currentHunk) {
          currentFile.hunks.push(currentHunk);
          currentHunk = null;
        }
        files.push(currentFile);
      }
      currentFile = {
        filePath: extractFilePath(line),
        linesAdded: 0,
        linesRemoved: 0,
        hunks: [],
      };
      continue;
    }

    if (!currentFile) continue;

    // Skip ---/+++ file headers
    if (line.startsWith("--- ") || line.startsWith("+++ ")) {
      // Update filePath from +++ line for accuracy
      if (line.startsWith("+++ b/")) {
        currentFile.filePath = line.slice(6).trim();
      }
      continue;
    }

    // Hunk header
    if (line.startsWith("@@")) {
      if (currentHunk) {
        currentFile.hunks.push(currentHunk);
      }
      currentHunk = { header: line, lines: [] };
      continue;
    }

    if (currentHunk) {
      currentHunk.lines.push(line);
      if (line.startsWith("+") && !line.startsWith("+++")) {
        currentFile.linesAdded++;
      } else if (line.startsWith("-") && !line.startsWith("---")) {
        currentFile.linesRemoved++;
      }
    }
  }

  // Flush last file
  if (currentFile) {
    if (currentHunk) {
      currentFile.hunks.push(currentHunk);
    }
    files.push(currentFile);
  }

  return files;
}

function extractFilePath(diffLine: string): string {
  // "diff --git a/path/to/file.ts b/path/to/file.ts" → "path/to/file.ts"
  const match = diffLine.match(/diff --git a\/(.+) b\/.+$/);
  return match ? match[1] : diffLine;
}
