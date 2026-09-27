import { useState } from "react";
import type { ReportAnalyses, Severity, Likelihood } from "../types/report";
import styles from "./AnalysisPanel.module.css";

interface Props {
  analyses: ReportAnalyses;
}

type Tab = "impact" | "tests" | "dependencies" | "risks";

const severityClass: Record<Severity, string> = {
  LOW: styles.severityLow,
  MEDIUM: styles.severityMedium,
  HIGH: styles.severityHigh,
  CRITICAL: styles.severityCritical,
};

const likelihoodClass: Record<Likelihood, string> = {
  LOW: styles.likelihoodLow,
  MEDIUM: styles.likelihoodMedium,
  HIGH: styles.likelihoodHigh,
};

export function AnalysisPanel({ analyses }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("risks");

  const criticalRisks = analyses.risks.filter((r) => r.severity === "CRITICAL").length;
  const highRisks = analyses.risks.filter((r) => r.severity === "HIGH").length;
  const uncoveredCount = analyses.tests.uncoveredPaths.length;

  const tabs: { id: Tab; label: string; badge?: string; badgeClass?: string }[] = [
    {
      id: "risks",
      label: "Risks",
      badge: criticalRisks > 0 ? `${criticalRisks} CRITICAL` : highRisks > 0 ? `${highRisks} HIGH` : `${analyses.risks.length}`,
      badgeClass: criticalRisks > 0 ? styles.badgeCritical : highRisks > 0 ? styles.badgeHigh : styles.badgeNeutral,
    },
    {
      id: "impact",
      label: "Impact",
      badge: `${analyses.impact.affectedComponents.length} files`,
      badgeClass: styles.badgeNeutral,
    },
    {
      id: "tests",
      label: "Tests",
      badge: uncoveredCount > 0 ? `${uncoveredCount} gaps` : "OK",
      badgeClass: uncoveredCount > 0 ? styles.badgeHigh : styles.badgeNeutral,
    },
    {
      id: "dependencies",
      label: "Dependencies",
      badge: `${analyses.dependencies.changed.length} changed`,
      badgeClass: styles.badgeNeutral,
    },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge && (
              <span className={`${styles.tabBadge} ${tab.badgeClass ?? ""}`}>{tab.badge}</span>
            )}
          </button>
        ))}
      </div>
      <div className={styles.panel}>
        {activeTab === "risks" && <RisksPanel analyses={analyses} />}
        {activeTab === "impact" && <ImpactPanel analyses={analyses} />}
        {activeTab === "tests" && <TestsPanel analyses={analyses} />}
        {activeTab === "dependencies" && <DepsPanel analyses={analyses} />}
      </div>
    </div>
  );
}

function RisksPanel({ analyses }: { analyses: ReportAnalyses }) {
  return (
    <div className={styles.section}>
      <p className={styles.sectionDesc}>
        {analyses.risks.length} risk{analyses.risks.length !== 1 ? "s" : ""} identified across the change set
      </p>
      <div className={styles.riskList}>
        {analyses.risks.map((risk, i) => (
          <div key={i} className={`${styles.riskItem} ${risk.severity === "CRITICAL" ? styles.riskItemCritical : risk.severity === "HIGH" ? styles.riskItemHigh : ""}`}>
            <div className={styles.riskHeader}>
              <span className={`${styles.severityBadge} ${severityClass[risk.severity]}`}>
                {risk.severity}
              </span>
              <span className={`${styles.likelihoodTag} ${likelihoodClass[risk.likelihood]}`}>
                {risk.likelihood} likelihood
              </span>
            </div>
            <p className={styles.riskDesc}>{risk.description}</p>
            <div className={styles.mitigation}>
              <span className={styles.mitigationLabel}>Mitigation:</span>
              {risk.mitigationSuggestion}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImpactPanel({ analyses }: { analyses: ReportAnalyses }) {
  const { impact } = analyses;
  return (
    <div className={styles.section}>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Affected Components</div>
        <ul className={styles.fileList}>
          {impact.affectedComponents.map((c) => (
            <li key={c} className={styles.filePath}>{c}</li>
          ))}
        </ul>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Blast Radius</div>
        <p className={styles.fieldValue}>{impact.blastRadius}</p>
      </div>
      {impact.breakingChanges.length > 0 && (
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Breaking Changes</div>
          <ul className={styles.breakingList}>
            {impact.breakingChanges.map((bc, i) => (
              <li key={i} className={styles.breakingItem}>{bc}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Notes</div>
        <p className={styles.fieldValue}>{impact.notes}</p>
      </div>
    </div>
  );
}

function TestsPanel({ analyses }: { analyses: ReportAnalyses }) {
  const { tests } = analyses;
  return (
    <div className={styles.section}>
      {tests.coveredPaths.length > 0 && (
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Covered Paths</div>
          <ul className={styles.fileList}>
            {tests.coveredPaths.map((p) => (
              <li key={p} className={`${styles.filePath} ${styles.covered}`}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      {tests.uncoveredPaths.length > 0 && (
        <div className={styles.field}>
          <div className={styles.fieldLabel}>Uncovered Paths</div>
          <ul className={styles.fileList}>
            {tests.uncoveredPaths.map((p) => (
              <li key={p} className={`${styles.filePath} ${styles.uncovered}`}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Gap Summary</div>
        <p className={styles.fieldValue}>{tests.gapSummary}</p>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Recommendation</div>
        <p className={styles.fieldValue}>{tests.recommendation}</p>
      </div>
    </div>
  );
}

function DepsPanel({ analyses }: { analyses: ReportAnalyses }) {
  const { dependencies } = analyses;
  return (
    <div className={styles.section}>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Changed Dependencies</div>
        {dependencies.changed.length > 0 ? (
          <ul className={styles.fileList}>
            {dependencies.changed.map((d) => (
              <li key={d} className={styles.depItem}>{d}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.fieldValue}>No dependency changes detected.</p>
        )}
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Regression Risk</div>
        <p className={styles.fieldValue}>{dependencies.regressionRisk}</p>
      </div>
      <div className={styles.field}>
        <div className={styles.fieldLabel}>Notes</div>
        <p className={styles.fieldValue}>{dependencies.notes}</p>
      </div>
    </div>
  );
}
