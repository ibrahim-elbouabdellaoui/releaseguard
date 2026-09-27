import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { parseDiff } from "../services/diffParser";
import { buildContext } from "../services/contextBuilder";

export const analyzeRouter = Router();

const CHANGES_DIR = path.resolve(__dirname, "../../../demo-project/changes");
const CONTEXT_DIR = path.resolve(__dirname, "../../context");

/**
 * GET /api/changes
 * Lists available demo change identifiers.
 */
analyzeRouter.get("/changes", (_req: Request, res: Response, next: NextFunction) => {
  try {
    const files = fs.readdirSync(CHANGES_DIR);
    const ids = files
      .filter((f) => f.endsWith(".diff"))
      .map((f) => f.replace(".diff", ""));
    res.json({ changes: ids });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/analyze
 * Body: { changeId: string }
 * Reads diff + meta from demo-project/changes/, builds context JSON, writes to backend/context/.
 */
analyzeRouter.post("/analyze", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { changeId } = req.body as { changeId?: string };
    if (!changeId || !/^[a-z0-9-]+$/.test(changeId)) {
      res.status(400).json({ error: "Invalid or missing changeId" });
      return;
    }

    const diffPath = path.join(CHANGES_DIR, `${changeId}.diff`);
    const metaPath = path.join(CHANGES_DIR, `${changeId}-meta.json`);

    if (!fs.existsSync(diffPath)) {
      res.status(404).json({ error: `Diff not found for changeId: ${changeId}` });
      return;
    }

    const rawDiff = fs.readFileSync(diffPath, "utf-8");
    const meta = fs.existsSync(metaPath)
      ? JSON.parse(fs.readFileSync(metaPath, "utf-8"))
      : {};

    const parsedDiff = parseDiff(rawDiff);
    const context = buildContext(changeId, rawDiff, parsedDiff, meta);

    const contextPath = path.join(CONTEXT_DIR, `${changeId}.json`);
    fs.mkdirSync(CONTEXT_DIR, { recursive: true });
    fs.writeFileSync(contextPath, JSON.stringify(context, null, 2), "utf-8");

    res.json({ success: true, changeId, contextPath: `context/${changeId}.json` });
  } catch (err) {
    next(err);
  }
});
