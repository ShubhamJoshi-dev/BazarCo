import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { getOpenApiSpec } from "./config/openapi";
import router from "./routes";

export function createApp(): Express {
  const app = express();
  const openApiSpec = getOpenApiSpec(env.BASE_URL);

  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (_req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get("/api-docs.json", (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  app.use(router);

  app.get("/", (_req: Request, res: Response) => {
    res.json({
      name: "BazarCo API",
      version: "1.0.0",
      docs: "/api-docs",
    });
  });


  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "Not Found" });
  });

  return app;
}
