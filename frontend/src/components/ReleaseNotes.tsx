import type { ReactNode } from "react";
import styles from "./ReleaseNotes.module.css";

interface Props {
  notes: string;
}

/** Renders the release notes markdown as structured plain text sections. */
export function ReleaseNotes({ notes }: Props) {
  // Split on markdown h3 headings (###) to get sections
  const sections = parseNotesSections(notes);

  return (
    <div className={styles.wrapper}>
      {sections.map((section, i) => (
        <div key={i} className={styles.section}>
          {section.title && <h3 className={styles.sectionTitle}>{section.title}</h3>}
          <div className={styles.body}>
            {section.lines.map((line, j) => renderLine(line, j))}
          </div>
        </div>
      ))}
    </div>
  );
}

interface Section {
  title: string;
  lines: string[];
}

function parseNotesSections(md: string): Section[] {
  const rawLines = md.split("\n");
  const sections: Section[] = [];
  let current: Section = { title: "", lines: [] };

  for (const line of rawLines) {
    if (line.startsWith("### ")) {
      if (current.lines.length > 0 || current.title) {
        sections.push(current);
      }
      current = { title: line.replace(/^###\s+/, "").replace(/^⛔\s*/, "").trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0 || current.title) {
    sections.push(current);
  }
  return sections.filter((s) => s.title || s.lines.some((l) => l.trim()));
}

function renderLine(line: string, key: number): ReactNode {
  const trimmed = line.trim();

  // Horizontal rule
  if (trimmed === "---") {
    return <hr key={key} className={styles.hr} />;
  }
  // Table row (skip table separators like |---|---|)
  if (trimmed.startsWith("|") && trimmed.includes("---")) {
    return null;
  }
  // Table row
  if (trimmed.startsWith("|")) {
    const cells = trimmed.split("|").filter((c) => c.trim());
    return (
      <div key={key} className={styles.tableRow}>
        {cells.map((cell, i) => (
          <span key={i} className={styles.tableCell}>{cell.trim()}</span>
        ))}
      </div>
    );
  }
  // List item
  if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
    return (
      <p key={key} className={styles.listItem}>
        {inlineFormat(trimmed.replace(/^[-*]\s+/, ""))}
      </p>
    );
  }
  // Numbered list
  if (/^\d+\.\s/.test(trimmed)) {
    return (
      <p key={key} className={styles.listItem}>
        {inlineFormat(trimmed)}
      </p>
    );
  }
  // Bold line (heading-like)
  if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
    return (
      <p key={key} className={styles.boldLine}>
        {trimmed.replace(/\*\*/g, "")}
      </p>
    );
  }
  // Empty line
  if (!trimmed) {
    return null;
  }
  // Normal paragraph
  return (
    <p key={key} className={styles.para}>
      {inlineFormat(trimmed)}
    </p>
  );
}

function inlineFormat(text: string): ReactNode {
  // Handle **bold** and `code` inline
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className={styles.code}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
}
