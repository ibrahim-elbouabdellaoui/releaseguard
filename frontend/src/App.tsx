import { ReportPage } from "./pages/ReportPage";
import styles from "./App.module.css";

function App() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>◈</span>
          <span className={styles.logoText}>ReleaseGuard</span>
        </div>
        <p className={styles.tagline}>AI-assisted release readiness — powered by IBM Bob 2.0</p>
      </header>
      <main className={styles.main}>
        <ReportPage />
      </main>
    </div>
  );
}

export default App;
