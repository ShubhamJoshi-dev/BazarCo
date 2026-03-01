/**
 * Deletes all products and all collections from the Shopify store
 * configured via SHOPIFY_STORE_DOMAIN and SHOPIFY_ACCESS_TOKEN in .env.
 *
 * Run from repo root: npm run script:delete-shopify
 * Or: npx tsx scripts/delete-shopify-products-collections.ts
 */
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const SHOPIFY_ACCESS_TOKEN = (process.env.SHOPIFY_ACCESS_TOKEN ?? "").trim();
const SHOPIFY_STORE_DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim();

function normalizeStoreDomain(domain: string): string {
  let store = domain.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase();
  if (!store.includes(".myshopify.com")) {
    store = `${store}.myshopify.com`;
  }
  return store;
}

async function graphql<T>(url: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const { data } = await axios.post<{ data?: T; errors?: { message: string }[] }>(
    url,
    { query, variables },
    {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
      },
      timeout: 30000,
    }
  );
  if (data.errors?.length) {
    throw new Error(data.errors.map((e) => e.message).join("; "));
  }
  return data.data as T;
}

async function fetchAllProductIds(url: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null = null;
  const query = `
    query($after: String) {
      products(first: 250, after: $after) {
        edges { node { id } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;
  do {
    const result = await graphql<{
      products: { edges: { node: { id: string } }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
    }>(url, query, { after: cursor });
    const { edges, pageInfo } = result.products;
    ids.push(...edges.map((e) => e.node.id));
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);
  return ids;
}

async function fetchAllCollectionIds(url: string): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | null = null;
  const query = `
    query($after: String) {
      collections(first: 250, after: $after) {
        edges { node { id } }
        pageInfo { hasNextPage endCursor }
      }
    }
  `;
  do {
    const result = await graphql<{
      collections: {
        edges: { node: { id: string } }[];
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
      };
    }>(url, query, { after: cursor });
    const { edges, pageInfo } = result.collections;
    ids.push(...edges.map((e) => e.node.id));
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (cursor);
  return ids;
}

async function deleteProduct(url: string, id: string): Promise<boolean> {
  const result = await graphql<{
    productDelete: { deletedProductId: string | null; userErrors: { message: string }[] };
  }>(
    url,
    `mutation($id: ID!) {
      productDelete(input: { id: $id }) {
        deletedProductId
        userErrors { message }
      }
    }`,
    { id }
  );
  if (result.productDelete.userErrors?.length) {
    console.warn("Product delete userErrors:", result.productDelete.userErrors);
    return false;
  }
  return result.productDelete.deletedProductId != null;
}

async function deleteCollection(url: string, id: string): Promise<boolean> {
  const result = await graphql<{
    collectionDelete: { deletedCollectionId: string | null; userErrors: { message: string }[] };
  }>(
    url,
    `mutation($id: ID!) {
      collectionDelete(input: { id: $id }) {
        deletedCollectionId
        userErrors { message }
      }
    }`,
    { id }
  );
  if (result.collectionDelete.userErrors?.length) {
    console.warn("Collection delete userErrors:", result.collectionDelete.userErrors);
    return false;
  }
  return result.collectionDelete.deletedCollectionId != null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  if (!SHOPIFY_ACCESS_TOKEN || !SHOPIFY_STORE_DOMAIN) {
    console.error("Set SHOPIFY_ACCESS_TOKEN and SHOPIFY_STORE_DOMAIN in .env");
    process.exit(1);
  }
  const store = normalizeStoreDomain(SHOPIFY_STORE_DOMAIN);
  const url = `https://${store}/admin/api/2024-01/graphql.json`;
  console.log("Store:", store);

  // 1) Products
  console.log("\nFetching product IDs...");
  const productIds = await fetchAllProductIds(url);
  console.log("Found", productIds.length, "products.");
  for (let i = 0; i < productIds.length; i++) {
    const ok = await deleteProduct(url, productIds[i]);
    if (ok) console.log("Deleted product", i + 1, "/", productIds.length);
    await sleep(350);
  }

  // 2) Collections (custom + smart)
  console.log("\nFetching collection IDs...");
  const collectionIds = await fetchAllCollectionIds(url);
  console.log("Found", collectionIds.length, "collections.");
  for (let i = 0; i < collectionIds.length; i++) {
    const ok = await deleteCollection(url, collectionIds[i]);
    if (ok) console.log("Deleted collection", i + 1, "/", collectionIds.length);
    await sleep(350);
  }

  console.log("\nDone. Deleted:", productIds.length, "products,", collectionIds.length, "collections.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
