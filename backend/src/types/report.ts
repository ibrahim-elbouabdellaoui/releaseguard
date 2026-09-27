/**
 * Canonical TypeScript types for the ReleaseGuard Release-Readiness Report.
 * This file is the source of truth. The frontend copy must stay in sync.
 */

export type Decision = "GO" | "GO-WITH-ACTIONS" | "NO-GO";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type Likelihood = "LOW" | "MEDIUM" | "HIGH";

export interface ReportChange {
  title: string;
  author: string;
  date: string;
  description: string;
  filesChanged: string[];
  linesAdded: number;
  linesRemoved: number;
}

export interface ReportVerdict {
  decision: Decision;
  riskLevel: RiskLevel;
  summary: string;
}

export interface ImpactAnalysis {
  affectedComponents: string[];
  blastRadius: string;
  breakingChanges: string[];
  notes: string;
}

export interface TestAnalysis {
  coveredPaths: string[];
  uncoveredPaths: string[];
  gapSummary: string;
  recommendation: string;
}

export interface DependencyAnalysis {
  changed: string[];
  regressionRisk: string;
  notes: string;
}

export interface RiskItem {
  description: string;
  severity: Severity;
  likelihood: Likelihood;
  mitigationSuggestion: string;
}

export interface ReportAnalyses {
  impact: ImpactAnalysis;
  tests: TestAnalysis;
  dependencies: DependencyAnalysis;
  risks: RiskItem[];
}

export interface RemediationAction {
  priority: number;
  action: string;
  rationale: string;
}

export interface ReleaseReadinessReport {
  id: string;
  generatedAt: string;
  change: ReportChange;
  verdict: ReportVerdict;
  analyses: ReportAnalyses;
  remediationActions: RemediationAction[];
  releaseNotes: string;
}

/**
 * Context file shape — produced by contextBuilder, consumed by the Bob Skill.
 */
export interface AnalysisContext {
  changeId: string;
  meta: {
    title: string;
    author: string;
    date: string;
    description: string;
    prDescription?: string;
  };
  diff: string;
  parsedDiff: ParsedDiffFile[];
  testInventory: string[];
  dependencyManifest: {
    before: Record<string, string>;
    after: Record<string, string>;
  };
}

export interface ParsedDiffFile {
  filePath: string;
  linesAdded: number;
  linesRemoved: number;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  header: string;
  lines: string[];
}
