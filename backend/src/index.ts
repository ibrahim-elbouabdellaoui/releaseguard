import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { analyzeRouter } from "./routes/analyze";
import { reportRouter } from "./routes/report";

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "releaseguard-backend" });
});

// Feature routes
app.use("/api", analyzeRouter);
app.use("/api", reportRouter);

// Centralised error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`ReleaseGuard backend running on http://localhost:${PORT}`);
});

export default app;
