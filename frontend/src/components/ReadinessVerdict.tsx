import type { ReportVerdict, Decision, RiskLevel } from "../types/report";
import styles from "./ReadinessVerdict.module.css";

interface Props {
  verdict: ReportVerdict;
}

const decisionLabel: Record<Decision, string> = {
  "GO": "GO",
  "GO-WITH-ACTIONS": "GO WITH ACTIONS",
  "NO-GO": "NO-GO",
};

const decisionClass: Record<Decision, string> = {
  "GO": styles.go,
  "GO-WITH-ACTIONS": styles.goWithActions,
  "NO-GO": styles.noGo,
};

const riskClass: Record<RiskLevel, string> = {
  LOW: styles.riskLow,
  MEDIUM: styles.riskMedium,
  HIGH: styles.riskHigh,
  CRITICAL: styles.riskCritical,
};

export function ReadinessVerdict({ verdict }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        <div className={`${styles.badge} ${decisionClass[verdict.decision]}`}>
          <span className={styles.badgeIcon}>
            {verdict.decision === "GO" ? "✓" : verdict.decision === "NO-GO" ? "✕" : "⚠"}
          </span>
          <span className={styles.badgeLabel}>{decisionLabel[verdict.decision]}</span>
        </div>
        <div className={`${styles.riskBadge} ${riskClass[verdict.riskLevel]}`}>
          {verdict.riskLevel} RISK
        </div>
      </div>
      <p className={styles.summary}>{verdict.summary}</p>
    </div>
  );
}
