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

/** Search products (Algolia). Index must have attributesForFaceting including "status", "category", "tags" for filters to work. */
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
  try {
    const filters: string[] = ["status:active"];
    if (category?.trim()) filters.push(`category:"${category.trim()}"`);
    if (tags?.length) {
      const tagFilters = tags.filter((t) => t?.trim()).map((t) => `tags:"${t.trim()}"`);
      if (tagFilters.length) filters.push(`(${tagFilters.join(" OR ")})`);
    }
    const searchParams: Record<string, unknown> = {
      query: query.trim() || "",
      page,
      hitsPerPage,
      attributesToRetrieve: ["objectID", "name", "description", "price", "imageUrl", "category", "tags", "createdBy"],
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
  } catch {
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
