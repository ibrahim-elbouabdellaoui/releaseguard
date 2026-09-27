import type { ReportChange } from "../types/report";
import styles from "./ChangeSummary.module.css";

interface Props {
  change: ReportChange;
  changeId: string;
}

export function ChangeSummary({ change, changeId }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>{change.title}</h2>
          <p className={styles.desc}>{change.description}</p>
        </div>
      </div>
      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Change ID</span>
          <span className={styles.metaValue}>{changeId}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Author</span>
          <span className={styles.metaValue}>{change.author}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Date</span>
          <span className={styles.metaValue}>{formatDate(change.date)}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Lines</span>
          <span className={styles.metaValue}>
            <span className={styles.added}>+{change.linesAdded}</span>
            {" / "}
            <span className={styles.removed}>-{change.linesRemoved}</span>
          </span>
        </div>
      </div>
      <div className={styles.files}>
        <span className={styles.metaLabel}>Files Changed ({change.filesChanged.length})</span>
        <ul className={styles.fileList}>
          {change.filesChanged.map((f) => (
            <li key={f} className={styles.file}>{f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}
