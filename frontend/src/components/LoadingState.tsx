import styles from "./LoadingState.module.css";

interface Props {
  changeId: string;
}

const STAGES = [
  { label: "Parsing diff", desc: "Extracting changed files and hunks" },
  { label: "Impact analysis", desc: "Identifying affected components and blast radius" },
  { label: "Test coverage", desc: "Checking test gaps and coverage paths" },
  { label: "Dependency audit", desc: "Reviewing changed packages and regression risk" },
  { label: "Risk assessment", desc: "Evaluating severity and likelihood of risks" },
  { label: "Synthesising verdict", desc: "Generating GO/NO-GO decision and remediation plan" },
];

export function LoadingState({ changeId }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.spinner} />
        <div>
          <p className={styles.title}>Analysing {changeId}…</p>
          <p className={styles.sub}>ReleaseGuard is running the analysis pipeline</p>
        </div>
      </div>
      <div className={styles.stages}>
        {STAGES.map((stage, i) => (
          <div key={i} className={styles.stage}>
            <div className={styles.stageDot} />
            <div className={styles.stageText}>
              <span className={styles.stageLabel}>{stage.label}</span>
              <span className={styles.stageDesc}>{stage.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
