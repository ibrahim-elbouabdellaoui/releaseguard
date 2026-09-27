/**
 * Frontend copy of the canonical report types.
 * Keep in sync with backend/src/types/report.ts.
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
