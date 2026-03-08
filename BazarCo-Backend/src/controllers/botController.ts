import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { buildContext, chatWithOpenAI, type BotMessage } from "../services/bot.service";

type ReqWithUser = Request & { user?: { id: string } };

/** POST body: { messages: { role: "user" | "assistant"; content: string }[], includeContext?: boolean } */
export async function chat(req: ReqWithUser, res: Response): Promise<void> {
  if (!req.user) {
    errorResponse(res, 401, "Authentication required");
    return;
  }

  const messages = Array.isArray(req.body.messages)
    ? (req.body.messages as BotMessage[]).filter(
        (m) =>
          m &&
          typeof m === "object" &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string"
      )
    : [];
  const includeContext = req.body.includeContext !== false;

  if (messages.length === 0) {
    errorResponse(res, 400, "At least one message is required");
    return;
  }

  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    errorResponse(res, 400, "Last message must be from the user");
    return;
  }

  let context: string | undefined;
  if (includeContext) {
    context = await buildContext({ hotProducts: 8, topReviews: 6 });
  }

  const { content, error: err } = await chatWithOpenAI(messages, context);
  if (err) {
    errorResponse(res, 500, err);
    return;
  }

  successResponse(res, 200, "OK", { reply: content });
}
