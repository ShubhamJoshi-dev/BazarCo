import { algoliasearch } from "algoliasearch";
import { env } from "../config/env";

let client: ReturnType<typeof algoliasearch> | null = null;

function getClient(): ReturnType<typeof algoliasearch> | null {
  if (!env.ALGOLIA_APP_ID || !env.ALGOLIA_WRITE_API_KEY) return null;
  if (!client) {
    client = algoliasearch(env.ALGOLIA_APP_ID, env.ALGOLIA_WRITE_API_KEY);
  }
  return client;
}

export function isAlgoliaConfigured(): boolean {
  return !!(env.ALGOLIA_APP_ID && env.ALGOLIA_WRITE_API_KEY);
}

/** Set index settings so full-text search works on name and description. Call once at startup or when creating the index. */
export async function setAlgoliaIndexSettings(): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.setSettings({
      indexName: env.ALGOLIA_INDEX_NAME,
      indexSettings: {
        searchableAttributes: ["name", "description"],
        attributesForFaceting: ["status", "category", "tags"],
      },
    });
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Algolia setSettings error]", message);
    return false;
  }
}

export interface AlgoliaProductRecord {
  objectID: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  createdBy: string;
  shopifyProductId?: string;
  status: string;
}

export interface BrowseProductHit {
  objectID: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  sellerId: string;
  createdBy: string;
}

/** Full-text search products in Algolia by name and description. Uses restrictSearchableAttributes so the query matches both fields. Index must have attributesForFaceting (status, category, tags) for filters; ensure name and description are searchable in the index. */
export async function searchProducts(params: {
  query: string;
  category?: string;
  tags?: string[];
  page?: number;
  hitsPerPage?: number;
}): Promise<{ hits: BrowseProductHit[]; nbHits: number; page: number; nbPages: number }> {
  const c = getClient();
  if (!c) return { hits: [], nbHits: 0, page: 0, nbPages: 0 };
  const { query = "", category, tags, page = 0, hitsPerPage = 24 } = params;
  const searchQuery = typeof query === "string" ? query.trim() : "";
  try {
    const filters: string[] = ["status:active"];
    if (category?.trim()) filters.push(`category:"${category.trim()}"`);
    if (tags?.length) {
      const tagFilters = tags.filter((t) => t?.trim()).map((t) => `tags:"${t.trim()}"`);
      if (tagFilters.length) filters.push(`(${tagFilters.join(" OR ")})`);
    }
    // Full-text search on name and description: restrict searchable attributes so the query matches both fields
    const searchParams: Record<string, unknown> = {
      query: searchQuery,
      page,
      hitsPerPage,
      attributesToRetrieve: ["objectID", "name", "description", "price", "imageUrl", "category", "tags", "createdBy"],
      restrictSearchableAttributes: ["name", "description"],
    };
    if (filters.length) searchParams.filters = filters.join(" AND ");
    const res = await c.searchSingleIndex({
      indexName: env.ALGOLIA_INDEX_NAME,
      searchParams,
    }) as { hits: Record<string, unknown>[]; nbHits: number; page: number; nbPages: number };
    const { hits = [], nbHits = 0, page: resPage = 0, nbPages = 0 } = res;
    const browseHits: BrowseProductHit[] = hits.map((h) => ({
      objectID: String(h.objectID),
      name: String(h.name ?? ""),
      description: h.description != null ? String(h.description) : undefined,
      price: Number(h.price ?? 0),
      imageUrl: h.imageUrl != null ? String(h.imageUrl) : undefined,
      category: h.category != null ? String(h.category) : undefined,
      tags: Array.isArray(h.tags) ? (h.tags as string[]) : undefined,
      sellerId: String(h.createdBy ?? ""),
      createdBy: String(h.createdBy ?? ""),
    }));
    return { hits: browseHits, nbHits, page: resPage, nbPages };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Algolia search error]", message);
    return { hits: [], nbHits: 0, page: 0, nbPages: 0 };
  }
}

export async function indexProduct(record: AlgoliaProductRecord): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.saveObjects({
      indexName: env.ALGOLIA_INDEX_NAME,
      objects: [record as unknown as Record<string, unknown>],
    });
    return true;
  } catch {
    return false;
  }
}

export async function updateProductInAlgolia(
  objectID: string,
  partial: Partial<Omit<AlgoliaProductRecord, "objectID">>
): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.partialUpdateObjects({
      indexName: env.ALGOLIA_INDEX_NAME,
      objects: [{ objectID, ...partial } as unknown as Record<string, unknown>],
    });
    return true;
  } catch {
    return false;
  }
}

export async function deleteProductFromAlgolia(objectID: string): Promise<boolean> {
  const c = getClient();
  if (!c) return false;
  try {
    await c.deleteObjects({
      indexName: env.ALGOLIA_INDEX_NAME,
      objectIDs: [objectID],
    });
    return true;
  } catch {
    return false;
  }
}
