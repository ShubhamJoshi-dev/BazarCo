function buildOpenApiSpec(serverUrl: string) {
  return {
    openapi: "3.0.3",
    info: {
      title: "BazarCo API",
      version: "1.0.0",
      description: "BazarCo backend API",
    },
    servers: [{ url: serverUrl, description: "API server" }],
    paths: {
      "/": {
        get: {
          operationId: "getRoot",
          summary: "API info",
          tags: ["Root"],
          responses: {
            "200": {
              description: "API name and version",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      name: { type: "string", example: "BazarCo API" },
                      version: { type: "string", example: "1.0.0" },
                      docs: { type: "string", example: "/api-docs" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/health": {
        get: {
          operationId: "getHealth",
          summary: "Health check",
          tags: ["Health"],
          responses: {
            "200": {
              description: "Service and DB status",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["status", "timestamp", "uptime", "environment", "db"],
                    properties: {
                      status: { type: "string", enum: ["ok"] },
                      timestamp: { type: "string", format: "date-time" },
                      uptime: { type: "number" },
                      environment: { type: "string", enum: ["development", "production", "test"] },
                      db: { type: "string", enum: ["connected", "disconnected"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/api/v1/notify": {
        post: {
          operationId: "postNotify",
          summary: "Notify signup",
          tags: ["Notify"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: {
                    email: { type: "string", format: "email" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Signup result",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      message: {
                        type: "string",
                        enum: ["Notification signup successful", "Already notified"],
                      },
                    },
                  },
                },
              },
            },
            "400": {
              description: "Invalid or missing email",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { error: { type: "string" } } },
                },
              },
            },
            "500": {
              description: "Server error",
              content: {
                "application/json": {
                  schema: { type: "object", properties: { error: { type: "string" } } },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function getOpenApiSpec(serverUrl: string) {
  return buildOpenApiSpec(serverUrl);
}
