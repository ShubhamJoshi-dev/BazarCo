import axios from "axios";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { User } from "../models/user.model";


export function isShopifyConfigured(): boolean {
  return !!(env.SHOPIFY_ACCESS_TOKEN && env.SHOPIFY_STORE_DOMAIN);
}
export interface CreateOrderItemInput {
  productId: string;
  variantId: string; // Shopify numeric or gid
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  buyerId: string;
  sellerId: string;
  items: CreateOrderItemInput[];
  total: number;
}
interface ProductCreateInput {
  title: string;
  descriptionHtml?: string;
}

interface ShopifyProductCreateResult {
  product?: { id: string };
  userErrors?: Array<{ field?: string[]; message: string }>;
}


function normalizeStoreDomain(domain: string): string {
  let store = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  if (!store.includes(".myshopify.com")) {
    store = `${store}.myshopify.com`;
  }
  return store;
}

export async function createShopifyProduct(
  input: ProductCreateInput
): Promise<{ productId: string; variantId: string } | null> {
  if (!isShopifyConfigured()) return null;

  const store = normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;

  const productInput = {
    title: input.title,
    descriptionHtml: input.descriptionHtml ?? "",
  };

  try {
    const { data: json } = await axios.post(
      url,
      {
        query: `
          mutation productCreate($product: ProductCreateInput!) {
            productCreate(product: $product) {
              userErrors { field message }
              product {
                id
                variants(first: 1) {
                  edges {
                    node {
                      id
                    }
                  }
                }
              }
            }
          }
        `,
        variables: { product: productInput },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": env.SHOPIFY_ACCESS_TOKEN,
        },
        timeout: 15000,
      }
    );

    if (json.errors?.length) return null;

    const data = json.data?.productCreate;

    if (data?.userErrors?.length) return null;

    const productId = data?.product?.id;
    const variantId =
      data?.product?.variants?.edges?.[0]?.node?.id;

    if (!productId || !variantId) return null;

    return { productId, variantId };
  } catch (error) {
    logger.error("Shopify product creation error:", error);
    return null;
  }

}export async function createShopifyOrder(
  input: CreateOrderInput
): Promise<{ id: string } | null> {
  if (!isShopifyConfigured()) return null;

  const store = normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;

  const buyer = await User.findById(input.buyerId);
  if (!buyer?.email) return null;

  const orderInput = {
    email: buyer.email,
    lineItems: input.items.map(item => ({
      variantId: item.variantId.startsWith("gid://")
        ? item.variantId
        : `gid://shopify/ProductVariant/${item.variantId}`,
      quantity: item.quantity,
    })),
    financialStatus: "PAID",
  };

  try {
    const { data: json } = await axios.post(
      url,
      {
        query: `
          mutation orderCreate($order: OrderCreateOrderInput!) {
            orderCreate(order: $order) {
              userErrors { field message }
              order { id }
            }
          }
        `,
        variables: { order: orderInput },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": env.SHOPIFY_ACCESS_TOKEN,
        },
        timeout: 15000,
      }
    );

    if (json.errors?.length) return null;

    const result = json.data?.orderCreate;

    if (result?.userErrors?.length) {
      logger.error("Shopify userErrors:", result.userErrors);
      return null;
    }

    const orderId = result?.order?.id;
    if (!orderId) return null;

    return { id: orderId };
  } catch (error) {
    logger.error("Shopify order creation error:", error);
    return null;
  }
}

interface DraftOrderLineItem {
  title: string;
  quantity: number;
  price: number;
}

interface DraftOrderResult {
  draftOrderId: string | null;
}

export async function createShopifyDraftOrder(params: {
  lineItems: DraftOrderLineItem[];
  note?: string;
  shippingAddress?: { line1: string; city: string; country: string; zip?: string; state?: string };
}): Promise<DraftOrderResult> {
  if (!isShopifyConfigured()) return { draftOrderId: null };
  const store = normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;

  const lineItems = params.lineItems.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    originalUnitPriceWithCurrency: {
      amount: String(item.price),
      currencyCode: "USD",
    },
  }));

  const input: Record<string, unknown> = { lineItems };
  if (params.note) input.note = params.note;
  if (params.shippingAddress) {
    input.shippingAddress = {
      address1: params.shippingAddress.line1,
      city: params.shippingAddress.city,
      country: params.shippingAddress.country,
      zip: params.shippingAddress.zip,
      province: params.shippingAddress.state,
    };
  }

  interface DraftOrderCreateResponse {
    data?: {
      draftOrderCreate?: {
        draftOrder?: { id: string };
        userErrors?: Array<{ message: string }>;
      };
    };
    errors?: unknown[];
  }

  try {
    const { data: json } = await axios.post<DraftOrderCreateResponse & { errors?: unknown[] }>(
      url,
      {
        query: `mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            userErrors { message }
            draftOrder { id }
          }
        }`,
        variables: { input },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": env.SHOPIFY_ACCESS_TOKEN,
        },
        timeout: 15000,
      }
    );
    if (json?.errors?.length) return { draftOrderId: null };
    const payload = json?.data?.draftOrderCreate;
    if (payload?.userErrors?.length || !payload?.draftOrder?.id) return { draftOrderId: null };
    return { draftOrderId: payload.draftOrder.id };
  } catch (error) {
    logger.error("Shopify draft order creation error:", error);
    return { draftOrderId: null };
  }
}

/**
 * Complete a draft order so it becomes a real order in Shopify.
 * Requires the draft order ID (GID, e.g. gid://shopify/DraftOrder/123).
 */
export async function completeShopifyDraftOrder(draftOrderId: string): Promise<{ orderId: string | null }> {
  if (!isShopifyConfigured() || !draftOrderId.trim()) return { orderId: null };

  const store = normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;

  const id = draftOrderId.startsWith("gid://") ? draftOrderId : `gid://shopify/DraftOrder/${draftOrderId}`;

  try {
    const { data: json } = await axios.post<{
      data?: {
        draftOrderComplete?: {
          draftOrder?: { id: string; order?: { id: string } };
          userErrors?: Array<{ field?: string[]; message: string }>;
        };
      };
      errors?: unknown[];
    }>(
      url,
      {
        query: `
          mutation draftOrderComplete($id: ID!) {
            draftOrderComplete(id: $id) {
              userErrors { field message }
              draftOrder {
                id
                order { id }
              }
            }
          }
        `,
        variables: { id },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": env.SHOPIFY_ACCESS_TOKEN,
        },
        timeout: 15000,
      }
    );

    if (json?.errors?.length) return { orderId: null };
    const payload = json?.data?.draftOrderComplete;
    if (payload?.userErrors?.length) {
      logger.warn("Shopify draftOrderComplete userErrors", payload.userErrors);
      return { orderId: null };
    }
    const orderId = payload?.draftOrder?.order?.id ?? null;
    return { orderId };
  } catch (error) {
    logger.error("Shopify draft order complete error:", error);
    return { orderId: null };
  }
}
