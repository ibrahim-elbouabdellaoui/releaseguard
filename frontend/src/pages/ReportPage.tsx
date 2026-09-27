import { useState, useEffect } from "react";
import type { ReleaseReadinessReport } from "../types/report";
import { fetchChanges, triggerAnalysis, fetchReport } from "../services/api";
import { ChangeSelector } from "../components/ChangeSelector";
import { ChangeSummary } from "../components/ChangeSummary";
import { ReadinessVerdict } from "../components/ReadinessVerdict";
import { AnalysisPanel } from "../components/AnalysisPanel";
import { RemediationChecklist } from "../components/RemediationChecklist";
import { ReleaseNotes } from "../components/ReleaseNotes";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import styles from "./ReportPage.module.css";

type PageState =
  | { kind: "idle" }
  | { kind: "loading"; changeId: string }
  | { kind: "report"; report: ReleaseReadinessReport }
  | { kind: "error"; message: string; changeId: string };

export function ReportPage() {
  const [changes, setChanges] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pageState, setPageState] = useState<PageState>({ kind: "idle" });
  const [loadingChanges, setLoadingChanges] = useState(true);

  useEffect(() => {
    fetchChanges()
      .then(({ changes: ids }) => setChanges(ids))
      .catch(() => setChanges([]))
      .finally(() => setLoadingChanges(false));
  }, []);

  const isRunning = pageState.kind === "loading";

  async function runAnalysis() {
    if (!selectedId || isRunning) return;
    setPageState({ kind: "loading", changeId: selectedId });
    try {
      await triggerAnalysis(selectedId);
      const report = await fetchReport(selectedId);
      setPageState({ kind: "report", report });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setPageState({ kind: "error", message: msg, changeId: selectedId });
    }
  }

  function reset() {
    setPageState({ kind: "idle" });
  }

  const showReport = pageState.kind === "report";

  return (
    <div className={styles.page}>
      {/* Left column: controls */}
      <div className={styles.sidebar}>
        {loadingChanges ? (
          <div className={styles.sidebarLoading}>Loading changes…</div>
        ) : (
          <ChangeSelector
            changes={changes}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (pageState.kind !== "idle") reset();
            }}
            disabled={isRunning}
          />
        )}

        <button
          className={styles.runButton}
          onClick={runAnalysis}
          disabled={!selectedId || isRunning}
        >
          {isRunning ? (
            <>
              <span className={styles.runSpinner} />
              Analysing…
            </>
          ) : (
            <>
              <span className={styles.runIcon}>◈</span>
              Run ReleaseGuard Analysis
            </>
          )}
        </button>

        {showReport && (
          <div className={styles.sidebarMeta}>
            <div className={styles.sidebarMetaRow}>
              <span className={styles.sidebarMetaLabel}>Generated</span>
              <span className={styles.sidebarMetaValue}>
                {formatDateTime(pageState.report.generatedAt)}
              </span>
            </div>
            <div className={styles.sidebarMetaRow}>
              <span className={styles.sidebarMetaLabel}>Report ID</span>
              <span className={styles.sidebarMetaValue}>{pageState.report.id}</span>
            </div>
          </div>
        )}
      </div>

      {/* Right column: content */}
      <div className={styles.content}>
        {pageState.kind === "idle" && !selectedId && (
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>◈</div>
            <h2 className={styles.welcomeTitle}>Release Readiness Analysis</h2>
            <p className={styles.welcomeDesc}>
              Select a change from the panel on the left, then click{" "}
              <strong>Run ReleaseGuard Analysis</strong> to assess whether it is safe
              to release. ReleaseGuard evaluates impact, test coverage, dependencies,
              and risk across four specialist analysis dimensions.
            </p>
            <div className={styles.welcomeSteps}>
              {[
                "Select a change",
                "Run the analysis",
                "Review the verdict",
                "Inspect findings",
                "Act on remediation",
              ].map((step, i) => (
                <div key={i} className={styles.welcomeStep}>
                  <span className={styles.welcomeStepNum}>{i + 1}</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pageState.kind === "idle" && selectedId && (
          <div className={styles.readyPrompt}>
            <p className={styles.readyText}>
              Change <strong>{selectedId}</strong> selected. Click{" "}
              <strong>Run ReleaseGuard Analysis</strong> to begin.
            </p>
          </div>
        )}

        {pageState.kind === "loading" && (
          <LoadingState changeId={pageState.changeId} />
        )}

        {pageState.kind === "error" && (
          <ErrorState
            message={pageState.message}
            onRetry={runAnalysis}
          />
        )}

        {showReport && (
          <div className={styles.report}>
            {/* Change Summary */}
            <section className={styles.reportSection}>
              <h3 className={styles.sectionLabel}>Change</h3>
              <ChangeSummary
                change={pageState.report.change}
                changeId={pageState.report.id}
              />
            </section>

            {/* Verdict */}
            <section className={styles.reportSection}>
              <h3 className={styles.sectionLabel}>Release Decision</h3>
              <ReadinessVerdict verdict={pageState.report.verdict} />
            </section>

            {/* Analysis */}
            <section className={styles.reportSection}>
              <h3 className={styles.sectionLabel}>Analysis</h3>
              <AnalysisPanel analyses={pageState.report.analyses} />
            </section>

            {/* Remediation */}
            <section className={styles.reportSection}>
              <h3 className={styles.sectionLabel}>Remediation</h3>
              <RemediationChecklist actions={pageState.report.remediationActions} />
            </section>

            {/* Release Notes */}
            <section className={styles.reportSection}>
              <h3 className={styles.sectionLabel}>Release Notes</h3>
              <ReleaseNotes notes={pageState.report.releaseNotes} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
