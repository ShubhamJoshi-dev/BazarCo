import express, { type Express, type Request, type Response } from "express";
import { healthRouter } from "./routes/health.js";


export function createApp(): Express {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));


  app.use("/health", healthRouter);


  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "BazarCo API",
      version: "1.0.0",
      docs: "/health",
    });
  });


  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
}
