import axios from "axios";
import { env } from "../config/env";
import { logger } from "../lib/logger";


export function isShopifyConfigured(): boolean {
  return !!(env.SHOPIFY_ACCESS_TOKEN && env.SHOPIFY_STORE_DOMAIN);
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

export async function createShopifyProduct(input: ProductCreateInput): Promise<{ id: string } | null> {
  if (!isShopifyConfigured()) return null;
  const store = normalizeStoreDomain(env.SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;

  const productInput = { title: input.title, descriptionHtml: input.descriptionHtml ?? "" };

  try {
    const { data: json } = await axios.post<{
      data?: { productCreate: ShopifyProductCreateResult };
      errors?: unknown[];
    }>(
      url,
      {
        query: `mutation productCreate($product: ProductCreateInput!) {
          productCreate(product: $product) {
            userErrors { field message }
            product { id }
          }
        }`,
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
    if (data?.userErrors?.length || !data?.product?.id) return null;
    return { id: data.product.id };
  } catch (error) {
    logger.error("Shopify product creation error:", error);
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
    originalUnitPrice: String(item.price),
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
    const { data: json } = await axios.post<DraftOrderCreateResponse>(
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
    if (json.errors?.length) return { draftOrderId: null };
    const payload = json.data?.draftOrderCreate;
    if (payload?.userErrors?.length || !payload?.draftOrder?.id) return { draftOrderId: null };
    return { draftOrderId: payload.draftOrder.id };
  } catch (error) {
    logger.error("Shopify draft order creation error:", error);
    return { draftOrderId: null };
  }
}
