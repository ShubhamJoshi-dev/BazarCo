import winston from "winston";
import { env } from "../config/env";

const logLevel = process.env.LOG_LEVEL ?? (env.isDev ? "debug" : "info");

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: logLevel,
  format: env.isDev ? devFormat : prodFormat,
  defaultMeta: { service: "bazarco-backend" },
  transports: [new winston.transports.Console()],
});
