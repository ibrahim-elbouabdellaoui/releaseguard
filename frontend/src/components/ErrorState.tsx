import styles from "./ErrorState.module.css";

interface Props {
  message: string;
  onRetry: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>✕</div>
      <div>
        <p className={styles.title}>Analysis failed</p>
        <p className={styles.message}>{message}</p>
      </div>
      <button className={styles.retry} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}
