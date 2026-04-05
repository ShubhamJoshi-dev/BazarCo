/**
 * Seeds 100 products from DummyJSON API with real images.
 * Run: npm run seed:products  (or: npx tsx scripts/seed-products.ts)
 *
 * Fetches product data from https://dummyjson.com/products and maps it
 * to our schema with proper categories, tags, and image URLs.
 */
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import mongoose from "mongoose";
import { connectDb, disconnectDb } from "../src/config/db";
import { User } from "../src/models/user.model";
import { Category } from "../src/models/category.model";
import { Tag } from "../src/models/tag.model";
import { Product } from "../src/models/product.model";
import { isAlgoliaConfigured, indexProduct } from "../src/services/algolia.service";

const SELLER_EMAIL = "mainalisital123@gmail.com";

/* ── Category mapping from DummyJSON → our categories ── */
const CATEGORY_MAP: Record<string, string> = {
  smartphones: "Electronics",
  laptops: "Electronics",
  tablets: "Electronics",
  "mobile-accessories": "Electronics",
  "computer-accessories": "Electronics",
  fragrances: "Beauty & Personal Care",
  skincare: "Beauty & Personal Care",
  "beauty": "Beauty & Personal Care",
  groceries: "Food & Grocery",
  "home-decoration": "Home & Living",
  furniture: "Home & Living",
  "kitchen-accessories": "Home & Living",
  tops: "Clothing",
  "womens-dresses": "Clothing",
  "womens-tops": "Clothing",
  "mens-shirts": "Clothing",
  "shirts": "Clothing",
  "womens-shoes": "Footwear",
  "mens-shoes": "Footwear",
  "shoes": "Footwear",
  "mens-watches": "Accessories",
  "womens-watches": "Accessories",
  "womens-bags": "Accessories",
  "womens-jewellery": "Jewelry",
  sunglasses: "Accessories",
  automotive: "Automotive",
  motorcycle: "Automotive",
  lighting: "Home & Living",
  "sports-accessories": "Sports & Outdoors",
  vehicle: "Automotive",
};

const TAG_RULES = (p: DummyProduct): string[] => {
  const tags: string[] = ["new"];
  if (p.rating >= 4.5) tags.push("popular");
  if (p.discountPercentage >= 10) tags.push("sale");
  if (p.discountPercentage >= 20) tags.push("hot-deal");
  if (p.stock <= 20) tags.push("limited");
  if (p.rating >= 4.8) tags.push("trending");
  return tags;
};

interface DummyProduct {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
}

interface DummyResponse {
  products: DummyProduct[];
  total: number;
}

async function fetchProducts(): Promise<DummyProduct[]> {
  console.log("Fetching products from DummyJSON API…");
  try {
    const res = await fetch("https://dummyjson.com/products?limit=100&skip=0");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as DummyResponse;
    console.log(`Fetched ${data.products.length} products from DummyJSON.`);
    return data.products;
  } catch (err) {
    console.warn("Could not fetch from DummyJSON, using local fallback data:", String(err));
    return FALLBACK_PRODUCTS;
  }
}

/* ── Fallback if network is unavailable ── */
const FALLBACK_PRODUCTS: DummyProduct[] = [
  { id: 1,  title: "iPhone 14 Pro",         description: "Latest Apple flagship with Dynamic Island and 48MP camera.", price: 999, discountPercentage: 5,  rating: 4.8, stock: 50, brand: "Apple",   category: "smartphones",    thumbnail: "https://cdn.dummyjson.com/product-images/1/thumbnail.jpg" },
  { id: 2,  title: "MacBook Pro 14\"",       description: "M2 Pro chip, 16GB RAM, 512GB SSD. Perfect for professionals.", price: 1999, discountPercentage: 3,  rating: 4.9, stock: 30, brand: "Apple",   category: "laptops",        thumbnail: "https://cdn.dummyjson.com/product-images/7/thumbnail.jpg" },
  { id: 3,  title: "Samsung Galaxy S23",     description: "Snapdragon 8 Gen 2, 200MP camera, all-day battery life.", price: 799, discountPercentage: 12, rating: 4.7, stock: 60, brand: "Samsung", category: "smartphones",    thumbnail: "https://cdn.dummyjson.com/product-images/3/thumbnail.jpg" },
  { id: 4,  title: "Sony WH-1000XM5",       description: "Industry-leading noise cancellation, 30hr battery.", price: 349, discountPercentage: 15, rating: 4.9, stock: 45, brand: "Sony",    category: "mobile-accessories", thumbnail: "https://cdn.dummyjson.com/product-images/12/thumbnail.jpg" },
  { id: 5,  title: "Nike Air Max 270",       description: "Breathable, lightweight sneakers with Air cushioning.", price: 130, discountPercentage: 20, rating: 4.6, stock: 80, brand: "Nike",    category: "mens-shoes",      thumbnail: "https://cdn.dummyjson.com/product-images/48/thumbnail.jpg" },
  { id: 6,  title: "Levi's 501 Jeans",      description: "Classic straight-leg jeans in premium denim.", price: 89,  discountPercentage: 10, rating: 4.5, stock: 100, brand: "Levi's",  category: "mens-shirts",     thumbnail: "https://cdn.dummyjson.com/product-images/58/thumbnail.jpg" },
  { id: 7,  title: "Chanel No. 5 EDP",      description: "Iconic floral aldehyde fragrance. 50ml bottle.", price: 139, discountPercentage: 0,  rating: 4.8, stock: 25, brand: "Chanel",  category: "fragrances",      thumbnail: "https://cdn.dummyjson.com/product-images/13/thumbnail.jpg" },
  { id: 8,  title: "Instant Pot Duo 7-in-1",description: "Pressure cooker, slow cooker, rice cooker and more.", price: 99,  discountPercentage: 25, rating: 4.7, stock: 55, brand: "Instant Pot", category: "kitchen-accessories", thumbnail: "https://cdn.dummyjson.com/product-images/27/thumbnail.jpg" },
  { id: 9,  title: "Apple Watch Series 9",  description: "Advanced health monitoring, bright Always-On display.", price: 399, discountPercentage: 5,  rating: 4.8, stock: 40, brand: "Apple",   category: "mens-watches",    thumbnail: "https://cdn.dummyjson.com/product-images/45/thumbnail.jpg" },
  { id: 10, title: "Dyson V15 Vacuum",      description: "Powerful cordless vacuum with laser dust detection.", price: 749, discountPercentage: 8,  rating: 4.7, stock: 20, brand: "Dyson",   category: "home-decoration", thumbnail: "https://cdn.dummyjson.com/product-images/26/thumbnail.jpg" },
  { id: 11, title: "IKEA KALLAX Shelf",     description: "Versatile shelf unit, white, 77x147cm. 8 compartments.", price: 179, discountPercentage: 0,  rating: 4.4, stock: 35, brand: "IKEA",    category: "furniture",       thumbnail: "https://cdn.dummyjson.com/product-images/31/thumbnail.jpg" },
  { id: 12, title: "Estée Lauder Serum",    description: "Advanced Night Repair synchronized serum. 50ml.", price: 115, discountPercentage: 12, rating: 4.6, stock: 30, brand: "Estée Lauder", category: "skincare",     thumbnail: "https://cdn.dummyjson.com/product-images/16/thumbnail.jpg" },
  { id: 13, title: "Adidas Ultraboost 22",  description: "Responsive Boost midsole, Primeknit+ upper.", price: 190, discountPercentage: 15, rating: 4.7, stock: 70, brand: "Adidas",  category: "mens-shoes",      thumbnail: "https://cdn.dummyjson.com/product-images/49/thumbnail.jpg" },
  { id: 14, title: "KitchenAid Stand Mixer",description: "5Qt. Artisan stand mixer, tilt-head design.", price: 399, discountPercentage: 10, rating: 4.8, stock: 18, brand: "KitchenAid", category: "kitchen-accessories", thumbnail: "https://cdn.dummyjson.com/product-images/28/thumbnail.jpg" },
  { id: 15, title: "Organic Aloe Vera Gel", description: "100% pure aloe vera, soothing and hydrating.", price: 14,  discountPercentage: 5,  rating: 4.5, stock: 200, brand: "Green Leaf", category: "skincare",    thumbnail: "https://cdn.dummyjson.com/product-images/17/thumbnail.jpg" },
  { id: 16, title: "Dell XPS 15",           description: "OLED display, Intel i9, RTX 4060, 32GB RAM.", price: 1799, discountPercentage: 7,  rating: 4.7, stock: 22, brand: "Dell",    category: "laptops",         thumbnail: "https://cdn.dummyjson.com/product-images/8/thumbnail.jpg" },
  { id: 17, title: "Louis Vuitton Bag",     description: "Speedy 30 monogram canvas. Timeless elegance.", price: 1200, discountPercentage: 0,  rating: 4.9, stock: 10, brand: "Louis Vuitton", category: "womens-bags", thumbnail: "https://cdn.dummyjson.com/product-images/76/thumbnail.jpg" },
  { id: 18, title: "Zara Floral Midi Dress",description: "Lightweight floral midi dress with V-neckline.", price: 69,  discountPercentage: 30, rating: 4.4, stock: 55, brand: "Zara",    category: "womens-dresses",  thumbnail: "https://cdn.dummyjson.com/product-images/61/thumbnail.jpg" },
  { id: 19, title: "GoPro HERO12 Black",    description: "5.3K60 video, HyperSmooth 6.0, waterproof.", price: 399, discountPercentage: 10, rating: 4.7, stock: 28, brand: "GoPro",   category: "mobile-accessories", thumbnail: "https://cdn.dummyjson.com/product-images/22/thumbnail.jpg" },
  { id: 20, title: "Nescafé Gold Blend",    description: "Smooth, rich instant coffee. 200g jar.", price: 12,  discountPercentage: 5,  rating: 4.3, stock: 500, brand: "Nescafé", category: "groceries",        thumbnail: "https://cdn.dummyjson.com/product-images/25/thumbnail.jpg" },
];

async function seed(): Promise<void> {
  await connectDb();

  const seller = await User.findOne({ email: SELLER_EMAIL }).select("_id").lean();
  if (!seller) {
    console.error(`Run npm run seed:dev first to create seller: ${SELLER_EMAIL}`);
    await disconnectDb();
    process.exit(1);
  }
  const sellerId = (seller as { _id: mongoose.Types.ObjectId })._id;

  /* ── Fetch products ── */
  const dummyProducts = await fetchProducts();

  /* ── Build unique categories ── */
  const uniqueCategoryNames = new Set<string>();
  for (const p of dummyProducts) {
    const mapped = CATEGORY_MAP[p.category] ?? p.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    uniqueCategoryNames.add(mapped);
  }

  const categoryIds = new Map<string, mongoose.Types.ObjectId>();
  for (const name of uniqueCategoryNames) {
    let cat = await Category.findOne({ name }).lean();
    if (!cat) {
      const created = await Category.create({ name });
      cat = created.toObject();
      console.log("  Created category:", name);
    }
    categoryIds.set(name, (cat as { _id: mongoose.Types.ObjectId })._id);
  }

  /* ── Build unique tags ── */
  const allTagNames = new Set<string>();
  for (const p of dummyProducts) TAG_RULES(p).forEach((t) => allTagNames.add(t));

  const tagIds = new Map<string, mongoose.Types.ObjectId>();
  for (const name of allTagNames) {
    let tag = await Tag.findOne({ name }).lean();
    if (!tag) {
      const created = await Tag.create({ name });
      tag = created.toObject();
      console.log("  Created tag:", name);
    }
    tagIds.set(name, (tag as { _id: mongoose.Types.ObjectId })._id);
  }

  /* ── Seed products ── */
  let created = 0;
  let skipped = 0;

  for (const p of dummyProducts) {
    const name = p.title;
    const existing = await Product.findOne({ name, sellerId }).lean();
    if (existing) { skipped++; continue; }

    const mappedCategory = CATEGORY_MAP[p.category]
      ?? p.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const categoryId = categoryIds.get(mappedCategory);
    const productTags = TAG_RULES(p).map((t) => tagIds.get(t)).filter(Boolean) as mongoose.Types.ObjectId[];

    const doc = await Product.create({
      name,
      description: `${p.description} Brand: ${p.brand}.`,
      price: parseFloat(p.price.toFixed(2)),
      imageUrl: p.thumbnail,
      sellerId,
      status: "active",
      categoryId: categoryId ?? undefined,
      tagIds: productTags,
    });

    const obj = doc.toObject() as { _id: mongoose.Types.ObjectId; sellerId: mongoose.Types.ObjectId };
    if (isAlgoliaConfigured()) {
      try {
        await indexProduct({
          objectID: obj._id.toString(),
          name,
          description: p.description,
          price: p.price,
          category: mappedCategory,
          tags: TAG_RULES(p),
          createdBy: obj.sellerId.toString(),
          status: "active",
        });
      } catch (algoliaErr) {
        console.warn("  Algolia indexing failed for", name, ":", String(algoliaErr));
      }
    }

    console.log(`  ✓ ${name} — $${p.price} [${mappedCategory}]`);
    created++;
  }

  await disconnectDb();
  console.log(`\nSeed complete! Created: ${created}, Skipped (already exist): ${skipped}`);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
