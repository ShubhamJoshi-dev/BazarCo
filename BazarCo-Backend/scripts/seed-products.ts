/**
 * Seeds categories, tags, and sample products for the seller from seed-dev-users.
 * Run: npm run seed:products (or npx tsx scripts/seed-products.ts)
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

const CATEGORY_NAMES = ["Electronics", "Clothing", "Home"];
const TAG_NAMES = ["popular", "new", "sale", "trending"];

const SAMPLE_PRODUCTS = [
  { name: "Wireless Earbuds Pro", description: "Premium sound, 24h battery.", price: 79.99, category: "Electronics", tags: ["popular", "new"] },
  { name: "Organic Cotton T-Shirt", description: "Soft, sustainable fabric.", price: 24.99, category: "Clothing", tags: ["sale", "trending"] },
  { name: "Smart Watch Series X", description: "Track fitness and notifications.", price: 199.99, category: "Electronics", tags: ["popular"] },
  { name: "Minimalist Desk Lamp", description: "LED, adjustable brightness.", price: 45.0, category: "Home", tags: ["new"] },
  { name: "Running Sneakers", description: "Lightweight, breathable.", price: 89.99, category: "Clothing", tags: ["trending", "sale"] },
  { name: "Portable Bluetooth Speaker", description: "Water-resistant, 12h play.", price: 59.99, category: "Electronics", tags: ["popular", "sale"] },
  { name: "Ceramic Coffee Set", description: "4 mugs and a carafe.", price: 34.99, category: "Home", tags: ["new", "trending"] },
  { name: "Yoga Mat Premium", description: "Non-slip, eco-friendly.", price: 29.99, category: "Clothing", tags: ["popular"] },
  { name: "USB-C Hub 7-in-1", description: "HDMI, SD, USB ports.", price: 49.99, category: "Electronics", tags: ["new", "sale"] },
  { name: "Throw Blanket", description: "Cozy fleece, machine wash.", price: 39.99, category: "Home", tags: ["trending"] },
];

async function seed(): Promise<void> {
  await connectDb();

  const seller = await User.findOne({ email: SELLER_EMAIL }).select("_id").lean();
  if (!seller) {
    console.error("Run seed:dev first to create the seller user:", SELLER_EMAIL);
    await disconnectDb();
    process.exit(1);
  }
  const sellerId = seller._id as mongoose.Types.ObjectId;

  const categoryIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const name of CATEGORY_NAMES) {
    let cat = await Category.findOne({ name }).lean();
    if (!cat) {
      const created = await Category.create({ name });
      cat = created.toObject();
      console.log("Created category:", name);
    }
    categoryIds[name] = (cat as { _id: mongoose.Types.ObjectId })._id;
  }

  const tagIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const name of TAG_NAMES) {
    let tag = await Tag.findOne({ name }).lean();
    if (!tag) {
      const created = await Tag.create({ name });
      tag = created.toObject();
      console.log("Created tag:", name);
    }
    tagIds[name] = (tag as { _id: mongoose.Types.ObjectId })._id;
  }

  for (const p of SAMPLE_PRODUCTS) {
    const existing = await Product.findOne({ name: p.name, sellerId }).lean();
    if (existing) {
      console.log("Product already exists:", p.name);
      continue;
    }
    const categoryId = categoryIds[p.category];
    const tagIdsArr = p.tags.map((t) => tagIds[t]).filter(Boolean);
    const doc = await Product.create({
      name: p.name,
      description: p.description,
      price: p.price,
      sellerId,
      status: "active",
      categoryId: categoryId ?? undefined,
      tagIds: tagIdsArr,
    });
    const obj = doc.toObject() as { _id: mongoose.Types.ObjectId; sellerId: mongoose.Types.ObjectId };
    if (isAlgoliaConfigured()) {
      await indexProduct({
        objectID: obj._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        tags: p.tags,
        createdBy: obj.sellerId.toString(),
        status: "active",
      });
    }
    console.log("Created product:", p.name);
  }

  await disconnectDb();
  console.log("Seed done. Products:", SAMPLE_PRODUCTS.length);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
