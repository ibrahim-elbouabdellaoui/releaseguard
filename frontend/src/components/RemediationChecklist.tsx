import type { RemediationAction } from "../types/report";
import styles from "./RemediationChecklist.module.css";

interface Props {
  actions: RemediationAction[];
}

export function RemediationChecklist({ actions }: Props) {
  return (
    <div className={styles.wrapper}>
      <ol className={styles.list}>
        {actions.map((action) => (
          <li key={action.priority} className={styles.item}>
            <div className={styles.priorityBadge}>#{action.priority}</div>
            <div className={styles.content}>
              <p className={styles.action}>{action.action}</p>
              <p className={styles.rationale}>{action.rationale}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
