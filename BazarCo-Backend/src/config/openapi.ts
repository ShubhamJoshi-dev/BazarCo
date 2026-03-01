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
      "/health": {
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
      "/auth/signup": {
        post: {
          operationId: "postSignup",
          summary: "Create account",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string", minLength: 8 },
                    name: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "201": { description: "Account created" },
            "400": { description: "Validation error" },
            "409": { description: "Email already exists" },
            "500": { description: "Server error" },
          },
        },
      },
      "/auth/login": {
        post: {
          operationId: "postLogin",
          summary: "Sign in",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Signed in" },
            "401": { description: "Invalid credentials" },
            "500": { description: "Server error" },
          },
        },
      },
      "/auth/forgot-password": {
        post: {
          operationId: "postForgotPassword",
          summary: "Request password reset",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["email"],
                  properties: { email: { type: "string", format: "email" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Reset email sent if account exists" },
            "400": { description: "Invalid email" },
            "500": { description: "Server error" },
          },
        },
      },
      "/auth/reset-password": {
        post: {
          operationId: "postResetPassword",
          summary: "Reset password with token",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["token", "password"],
                  properties: {
                    token: { type: "string" },
                    password: { type: "string", minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Password reset" },
            "400": { description: "Invalid or expired token" },
            "500": { description: "Server error" },
          },
        },
      },
      "/notify": {
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
