import styles from "./ChangeSelector.module.css";

// Static metadata for the demo changes (augments the bare IDs from /api/changes)
const CHANGE_META: Record<string, {
  title: string;
  branch: string;
  author: string;
  date: string;
  ticketId?: string;
}> = {
  "change-001": {
    title: "Enrich user profile response + bump zod dependency",
    branch: "feature/enrich-user-profile → main",
    author: "Dev Team",
    date: "2024-01-15",
    ticketId: "SHOP-1042",
  },
};

interface Props {
  changes: string[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled: boolean;
}

export function ChangeSelector({ changes, selectedId, onSelect, disabled }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.heading}>Select a Change</h2>
        <span className={styles.count}>{changes.length} available</span>
      </div>
      <div className={styles.list}>
        {changes.map((id) => {
          const meta = CHANGE_META[id];
          const isSelected = id === selectedId;
          return (
            <button
              key={id}
              className={`${styles.card} ${isSelected ? styles.cardSelected : ""}`}
              onClick={() => onSelect(id)}
              disabled={disabled}
            >
              <div className={styles.cardTop}>
                <span className={styles.changeId}>{id}</span>
                {meta?.ticketId && <span className={styles.ticket}>{meta.ticketId}</span>}
                {isSelected && <span className={styles.selectedMark}>Selected</span>}
              </div>
              {meta ? (
                <>
                  <p className={styles.title}>{meta.title}</p>
                  <div className={styles.meta}>
                    <span>{meta.branch}</span>
                    <span className={styles.dot}>·</span>
                    <span>{meta.author}</span>
                    <span className={styles.dot}>·</span>
                    <span>{meta.date}</span>
                  </div>
                </>
              ) : (
                <p className={styles.title}>{id}</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
