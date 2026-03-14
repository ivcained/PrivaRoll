import { Router, Request, Response } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    service: "PrivaRoll Backend",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});
