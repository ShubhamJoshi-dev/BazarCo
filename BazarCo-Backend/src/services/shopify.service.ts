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
  } catch(error) {
    logger.error("Shopify product creation error:", error);
    return null;
  }
}
