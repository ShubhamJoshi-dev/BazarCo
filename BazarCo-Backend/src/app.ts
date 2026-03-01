import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { getOpenApiSpec } from "./config/openapi";
import router from "./routes";

function getAllowedOrigins(): string[] | null {
  if (!env.CORS_ORIGIN.trim()) return null;
  return env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean);
}

function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean | string) => void
): void {
  const allowed = getAllowedOrigins();
  if (!allowed || allowed.length === 0) {
    callback(null, true);
    return;
  }
  if (!origin) {
    callback(null, true);
    return;
  }
  const allow = allowed.includes(origin);
  callback(null, allow ? origin : false);
}

const corsOptions: cors.CorsOptions = {
  origin: corsOriginCallback,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204,
  preflightContinue: false,
};

export function createApp(): Express {
  const app = express();
  const openApiSpec = getOpenApiSpec(env.BASE_URL);

  // Handle preflight first so it always returns 204 before any other middleware
  app.use((req: Request, res: Response, next: () => void) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

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
