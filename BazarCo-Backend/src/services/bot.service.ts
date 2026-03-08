import { env } from "../config/env";
import * as productRepo from "../repositories/product.repository";
import * as reviewRepo from "../repositories/review.repository";
import * as categoryRepo from "../repositories/category.repository";
import type { Types } from "mongoose";

const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

export type BotMessage = { role: "user" | "assistant" | "system"; content: string };

const SYSTEM_PROMPT = `You are BazarCoBot, the friendly assistant for BazarCo — an e-commerce marketplace. You help users with:
- Navigating the app: Dashboard, Browse, Favourites, Cart, Orders, Offers, Chat.
- Finding hot / trending products and top reviews when they ask.
- General how-to: how to buy, how to sell, how to checkout, how to contact sellers.

Keep replies concise, helpful, and professional. When you have context about hot products or top reviews, mention them naturally (e.g. product names, prices, ratings). If the user asks for "hot products" or "top reviews" and you have that data below, use it. Otherwise suggest they use Browse or the product pages.`;

async function fetchHotProducts(limit: number): Promise<string> {
  const { docs } = await productRepo.findActiveForBrowse({ limit, skip: 0 });
  if (docs.length === 0) return "No products available right now.";
  const lines = await Promise.all(
    docs.slice(0, limit).map(async (d) => {
      const doc = d as Record<string, unknown> & { _id: Types.ObjectId; name: string; price?: number };
      let categoryName = "";
      if (doc.categoryId) {
        const cat = await categoryRepo.findCategoryById((doc.categoryId as Types.ObjectId).toString());
        categoryName = cat?.name ?? "";
      }
      const price = typeof doc.price === "number" ? doc.price : 0;
      return `- ${doc.name} (${categoryName}) — $${price.toFixed(2)} — id: ${doc._id.toString()}`;
    })
  );
  return lines.join("\n");
}

async function fetchTopReviews(limit: number): Promise<string> {
  const reviews = await reviewRepo.findRecent(limit);
  if (reviews.length === 0) return "No reviews yet.";
  const lines = reviews.map((r) => {
    const rev = r as { rating?: number; comment?: string; productId?: unknown; createdAt?: Date };
    const rating = rev.rating ?? 0;
    const comment = (rev.comment ?? "").slice(0, 120);
    const productId = rev.productId?.toString?.() ?? rev.productId;
    return `- Product ${productId}: ${rating}/5 — "${comment}${comment.length >= 120 ? "…" : ""}"`;
  });
  return lines.join("\n");
}

/** Build context string for hot products and top reviews to inject into the prompt. */
export async function buildContext(options: { hotProducts?: number; topReviews?: number }): Promise<string> {
  const { hotProducts = 8, topReviews = 6 } = options;
  const [hot, reviews] = await Promise.all([
    fetchHotProducts(hotProducts),
    fetchTopReviews(topReviews),
  ]);
  return [
    "--- Current BazarCo context (use when user asks for hot products or top reviews) ---",
    "Hot / recently listed products:",
    hot,
    "",
    "Recent top reviews (rating + short comment):",
    reviews,
    "--- End context ---",
  ].join("\n");
}

/** Call OpenAI chat and return the assistant reply. */
export async function chatWithOpenAI(
  messages: BotMessage[],
  context?: string
): Promise<{ content: string; error?: string }> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) {
    return { content: "", error: "Chat is not configured. Please set OPENAI_API_KEY." };
  }

  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\n${context}`
    : SYSTEM_PROMPT;
  const apiMessages: { role: string; content: string }[] = [
    { role: "system", content: systemContent },
    ...messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const res = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: apiMessages,
        max_tokens: 400,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { content: "", error: `OpenAI error: ${res.status} — ${errBody.slice(0, 200)}` };
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string }; finish_reason?: string }> };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";
    return { content: content || "I couldn’t generate a reply. Try asking something else." };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { content: "", error: `Request failed: ${message}` };
  }
}
