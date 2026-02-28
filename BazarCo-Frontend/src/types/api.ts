export interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  environment: string;
  db: "connected" | "disconnected";
}
