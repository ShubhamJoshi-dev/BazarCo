export interface HealthResponse {
  status: "ok";
  timestamp: string;
  uptime: number;
  environment: string;
  db: "connected" | "disconnected";
}

export interface NotifySuccessResponse {
  status: "success";
  message: string;
}

export interface NotifyErrorResponse {
  status: "error";
  message: string;
}

export type NotifyResponse = NotifySuccessResponse | NotifyErrorResponse;
