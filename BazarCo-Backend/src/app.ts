import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { getOpenApiSpec } from "./config/openapi";
import router from "./routes";

function getCorsOrigin(): string | string[] | boolean {
  if (!env.CORS_ORIGIN.trim()) {
    return true;
  }
  const origins = env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0]! : origins;
}

const corsOptions: cors.CorsOptions = {
  origin: getCorsOrigin(),
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
};

export function createApp(): Express {
  const app = express();
  const openApiSpec = getOpenApiSpec(env.BASE_URL);

  app.use(cors(corsOptions));
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
