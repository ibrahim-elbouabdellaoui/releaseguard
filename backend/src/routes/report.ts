import { Router, Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";

export const reportRouter = Router();

const REPORTS_DIR = path.resolve(__dirname, "../../reports");

/**
 * GET /api/report/:id
 * Serves a generated release-readiness report JSON artifact.
 */
reportRouter.get("/report/:id", (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id || !/^[a-z0-9-]+$/.test(id)) {
      res.status(400).json({ error: "Invalid report id" });
      return;
    }

    const reportPath = path.join(REPORTS_DIR, `report-${id}.json`);
    if (!fs.existsSync(reportPath)) {
      res.status(404).json({ error: `Report not found: ${id}` });
      return;
    }

    const report = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
    res.json(report);
  } catch (err) {
    next(err);
  }
});
