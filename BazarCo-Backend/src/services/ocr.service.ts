import OpenAI from "openai";
import { createWorker } from "tesseract.js";
import type { NepalIdExtractedData, CompanyCardExtractedData } from "../models/document.model";
import { logger } from "../lib/logger";
import { env } from "../config/env";

// ─── GPT-4 Vision helpers ────────────────────────────────────────────────────

function getOpenAiClient(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

async function extractWithVision(
  buffer: Buffer,
  prompt: string
): Promise<string> {
  const client = getOpenAiClient();
  if (!client) throw new Error("OPENAI_API_KEY not configured");
  const base64 = buffer.toString("base64");
  const mimeType = detectMime(buffer);
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64}`, detail: "high" },
          },
          { type: "text", text: prompt },
        ],
      },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

function detectMime(buf: Buffer): string {
  if (buf[0] === 0xff && buf[1] === 0xd8) return "image/jpeg";
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

// ─── Nepal National ID via GPT-4 Vision ─────────────────────────────────────

const NEPAL_ID_PROMPT = `You are an OCR assistant specialized in Nepal national identity cards (राष्ट्रिय परिचयपत्र).
Extract ALL visible text fields from this image and return ONLY a JSON object with these exact keys.
If a field is not visible or unreadable, use null.

{
  "name": "full name in Nepali script exactly as printed",
  "dateOfBirth": "date in the format साल/महिना/गते or as shown (BS calendar)",
  "citizenshipNumber": "citizenship/identity number (नागरिकता नम्बर)",
  "district": "district name (जिल्ला) in Nepali",
  "fatherName": "father's full name (पिताको नाम)",
  "motherName": "mother's full name (आमाको नाम)",
  "address": "permanent address (ठेगाना)",
  "gender": "लिङ्ग value: पुरुष or महिला or अन्य",
  "isValidNationalId": true or false — true only if this is a genuine Nepal national ID card
}

Respond with ONLY the JSON, no markdown, no extra text.`;

async function extractNepalIdWithVision(buffer: Buffer): Promise<{
  extractedData: NepalIdExtractedData;
  isValidNationalId: boolean;
  extractionStatus: "success" | "invalid";
}> {
  const raw = await extractWithVision(buffer, NEPAL_ID_PROMPT);
  // Strip markdown code fences if present
  const jsonStr = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    logger.warn("GPT-4 Vision returned non-JSON for Nepal ID", { raw });
    return {
      extractedData: { rawText: raw.slice(0, 2000) },
      isValidNationalId: false,
      extractionStatus: "invalid",
    };
  }

  const isValid = parsed.isValidNationalId === true;
  const data: NepalIdExtractedData = {
    rawText: raw.slice(0, 2000),
  };

  function s(v: unknown): string | undefined {
    if (v == null || v === "" || v === "null") return undefined;
    return String(v).trim() || undefined;
  }

  data.name = s(parsed.name);
  data["नाम"] = data.name;
  data.dateOfBirth = s(parsed.dateOfBirth);
  data["जन्म_मिति"] = data.dateOfBirth;
  data.citizenshipNumber = s(parsed.citizenshipNumber);
  data["नागरिकता_नम्बर"] = data.citizenshipNumber;
  data.district = s(parsed.district);
  data["जिल्ला"] = data.district;
  data.fatherName = s(parsed.fatherName);
  data["पिताको_नाम"] = data.fatherName;
  data.motherName = s(parsed.motherName);
  data["आमाको_नाम"] = data.motherName;
  data.address = s(parsed.address);
  data["ठेगाना"] = data.address;
  data.gender = s(parsed.gender);
  data["लिङ्ग"] = data.gender;

  return {
    extractedData: data,
    isValidNationalId: isValid,
    extractionStatus: isValid ? "success" : "invalid",
  };
}

// ─── Company Card via GPT-4 Vision ──────────────────────────────────────────

const COMPANY_CARD_PROMPT = `You are an OCR assistant specialized in Nepali/Indian business registration documents, PAN cards, company registration certificates, and company identity cards.
Extract ALL visible text fields from this image and return ONLY a JSON object with these exact keys.
If a field is not visible or unreadable, use null.

{
  "companyName": "official registered company name",
  "registrationNumber": "company registration number",
  "panNumber": "PAN number if visible",
  "vatNumber": "VAT registration number if visible",
  "companyType": "e.g. Private Limited, Sole Proprietorship, Partnership, Public Limited",
  "address": "registered address",
  "registeredDate": "date of registration as shown",
  "contactPhone": "phone number if visible",
  "contactEmail": "email address if visible",
  "ownerName": "owner or proprietor name if visible",
  "isValidCompanyCard": true or false — true only if this is a genuine business registration or company identity document
}

Respond with ONLY the JSON, no markdown, no extra text.`;

async function extractCompanyCardWithVision(buffer: Buffer): Promise<{
  extractedData: CompanyCardExtractedData;
  isValidCompanyCard: boolean;
  extractionStatus: "success" | "invalid";
}> {
  const raw = await extractWithVision(buffer, COMPANY_CARD_PROMPT);
  const jsonStr = raw.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr) as Record<string, unknown>;
  } catch {
    logger.warn("GPT-4 Vision returned non-JSON for company card", { raw });
    return {
      extractedData: { rawText: raw.slice(0, 2000) },
      isValidCompanyCard: false,
      extractionStatus: "invalid",
    };
  }

  const isValid = parsed.isValidCompanyCard === true;

  function s(v: unknown): string | undefined {
    if (v == null || v === "" || v === "null") return undefined;
    return String(v).trim() || undefined;
  }

  const data: CompanyCardExtractedData = {
    rawText: raw.slice(0, 2000),
    companyName: s(parsed.companyName),
    registrationNumber: s(parsed.registrationNumber),
    panNumber: s(parsed.panNumber),
    vatNumber: s(parsed.vatNumber),
    companyType: s(parsed.companyType),
    address: s(parsed.address),
    registeredDate: s(parsed.registeredDate),
    contactPhone: s(parsed.contactPhone),
    contactEmail: s(parsed.contactEmail),
    ownerName: s(parsed.ownerName),
  };

  return {
    extractedData: data,
    isValidCompanyCard: isValid,
    extractionStatus: isValid ? "success" : "invalid",
  };
}

// ─── Tesseract fallback ──────────────────────────────────────────────────────

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const langs = ["nep+eng", "eng"];
  for (const lang of langs) {
    try {
      const worker = await createWorker(lang as "nep+eng" | "eng", 1, {
        logger: (m) => (m.status === "recognizing text" ? undefined : logger.debug("Tesseract", m)),
      });
      try {
        const { data } = await worker.recognize(buffer);
        return data.text ?? "";
      } finally {
        await worker.terminate();
      }
    } catch (err) {
      if (lang === "eng") throw err;
      logger.warn("Tesseract nep+eng failed, falling back to eng", err);
    }
  }
  return "";
}

/** Strip all quote chars and normalize spacing in extracted OCR values. */
function cleanExtracted(s: string): string {
  return s
    .replace(/["'"''""`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SKIP_DISTRICT_VALUES = /^EER\s*sore$/i;

const LABELS = {
  name: ["नाम", "name", "Name", "NAM"],
  dateOfBirth: ["जन्म मिति", "जन्ममिति", "date of birth", "Date of Birth", "DOB"],
  citizenshipNumber: ["नागरिकता नम्बर", "नागरिकता नं", "citizenship no", "Citizenship Number", "नं"],
  district: ["जिल्ला", "district", "District", "Jilla"],
  fatherName: ["पिताको नाम", "पिताकोनाम", "father's name", "Father's Name"],
  motherName: ["आमाको नाम", "आमाकोनाम", "mother's name", "Mother's Name"],
  address: ["ठेगाना", "address", "Address", "Permanent Address"],
  gender: ["लिङ्ग", "gender", "Gender", "Sex"],
};

function normalizeDob(dob: string): string {
  const cleaned = cleanExtracted(dob);
  const sal = /साल\s*:\s*([०-९0-9]+)/.exec(cleaned)?.[1];
  const mahina = /महिना\s*:\s*([०-९0-9]+)/.exec(cleaned)?.[1];
  const gate = /गते\s*:\s*([०-९0-9]+)/.exec(cleaned)?.[1];
  if (sal ?? mahina ?? gate) {
    return [sal ?? "", mahina ?? "", gate ?? ""].filter(Boolean).join(" ");
  }
  const fallback = cleaned.match(/[०-९0-9]+/g);
  if (fallback && fallback.length > 0) return fallback.slice(0, 3).join(" ");
  return cleaned;
}

function splitNameAndGender(raw: string): { name: string; gender?: string } {
  let s = raw.replace(/["'"''""`]/g, "").replace(/\s+/g, " ").trim();
  s = s.replace(/^धर\s*:\s*/i, "").trim();
  const genderMark = /लिङ्ग\s*(.*)$/i.exec(s);
  let name = s;
  let gender: string | undefined;
  if (genderMark && genderMark[1]) {
    name = s.slice(0, genderMark.index).replace(/\s*लिङ्ग\s*$/i, "").trim();
    gender = cleanExtracted(genderMark[1]);
    if (gender && gender.length <= 50) {
      const g = gender.toLowerCase();
      if (g === "पुरुष" || g === "महिला" || g === "male" || g === "female" || g === "other") {
        gender = gender.trim();
      } else if (/\b(पुरुष|महिला|male|female)\b/i.test(gender)) {
        gender = (gender.match(/(पुरुष|महिला|male|female)/i) ?? [gender])[0];
      }
    } else {
      gender = undefined;
    }
  }
  name = cleanExtracted(name);
  return { name: name || s, gender };
}

export function parseNepalNationalIdText(rawText: string): NepalIdExtractedData {
  const out: NepalIdExtractedData = { rawText: rawText.slice(0, 2000) };
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  function valueAfter(labelVariants: string[]): string | undefined {
    for (const line of lines) {
      for (const label of labelVariants) {
        const idx = line.indexOf(label);
        if (idx === -1) continue;
        const after = line.slice(idx + label.length).replace(/^[\s:\-–—]+/, "").trim();
        if (after.length > 0 && after.length < 200) return after;
      }
    }
    for (let i = 0; i < lines.length; i++) {
      for (const label of labelVariants) {
        if (lines[i].includes(label) && lines[i + 1]) {
          const v = lines[i + 1].trim();
          if (v.length > 0 && v.length < 200) return v;
        }
      }
    }
    return undefined;
  }

  const nameRaw = valueAfter(LABELS.name);
  if (nameRaw) {
    const { name, gender: genderFromName } = splitNameAndGender(nameRaw);
    const nameFinal = cleanExtracted(name);
    if (nameFinal) { out["नाम"] = nameFinal; out.name = nameFinal; }
    if (genderFromName) { out["लिङ्ग"] = genderFromName; out.gender = genderFromName; }
  }
  const dob = valueAfter(LABELS.dateOfBirth);
  if (dob) {
    const normalized = normalizeDob(dob);
    if (normalized) { out["जन्म_मिति"] = normalized; out.dateOfBirth = normalized; }
  }
  const citizenship = valueAfter(LABELS.citizenshipNumber);
  if (citizenship) {
    const c = cleanExtracted(citizenship).replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, "");
    if (c) { out["नागरिकता_नम्बर"] = c; out.citizenshipNumber = c; }
  }
  const district = valueAfter(LABELS.district);
  if (district) {
    const d = cleanExtracted(district);
    if (d && d.length < 100 && !SKIP_DISTRICT_VALUES.test(d)) {
      out["जिल्ला"] = d; out.district = d;
    }
  }
  const father = valueAfter(LABELS.fatherName);
  if (father) { const f = cleanExtracted(father); if (f) { out["पिताको_नाम"] = f; out.fatherName = f; } }
  const mother = valueAfter(LABELS.motherName);
  if (mother) { const m = cleanExtracted(mother); if (m) { out["आमाको_नाम"] = m; out.motherName = m; } }
  const address = valueAfter(LABELS.address);
  if (address) { const a = cleanExtracted(address); if (a) { out["ठेगाना"] = a; out.address = a; } }
  const gender = valueAfter(LABELS.gender);
  if (gender) { const g = cleanExtracted(gender); if (g && !out["लिङ्ग"]) { out["लिङ्ग"] = g; out.gender = g; } }

  return out;
}

export function isValidNepalNationalId(data: NepalIdExtractedData): boolean {
  const hasName = Boolean(data["नाम"] ?? data.name);
  const hasDob = Boolean(data["जन्म_मिति"] ?? data.dateOfBirth);
  const hasCitizenship = Boolean(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber);
  const hasDistrict = Boolean(data["जिल्ला"] ?? data.district);
  const hasAnyKeyField = hasName || hasDob || hasCitizenship || hasDistrict;
  const hasNepaliOrIdLike = Boolean(
    data.rawText &&
    (data.rawText.includes("नाम") || data.rawText.includes("जन्म") ||
      data.rawText.includes("नागरिकता") || data.rawText.includes("परिचय") ||
      /\d{6,}/.test(data.rawText))
  );
  return hasAnyKeyField || hasNepaliOrIdLike;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/** Extract Nepal national ID — uses GPT-4 Vision if OPENAI_API_KEY is set, else Tesseract. */
export async function extractNepalNationalId(buffer: Buffer): Promise<{
  extractedData: NepalIdExtractedData;
  isValidNationalId: boolean;
  extractionStatus: "success" | "invalid";
}> {
  if (env.OPENAI_API_KEY) {
    try {
      return await extractNepalIdWithVision(buffer);
    } catch (err) {
      logger.warn("GPT-4 Vision failed for Nepal ID, falling back to Tesseract", err);
    }
  }
  // Tesseract fallback
  const rawText = await extractTextFromImage(buffer);
  const extractedData = parseNepalNationalIdText(rawText);
  const isValidNationalId = isValidNepalNationalId(extractedData);
  return {
    extractedData,
    isValidNationalId,
    extractionStatus: isValidNationalId ? "success" : "invalid",
  };
}

/** Extract company card data — uses GPT-4 Vision if OPENAI_API_KEY is set, else basic OCR. */
export async function extractCompanyCard(buffer: Buffer): Promise<{
  extractedData: CompanyCardExtractedData;
  isValidCompanyCard: boolean;
  extractionStatus: "success" | "invalid";
}> {
  if (env.OPENAI_API_KEY) {
    try {
      return await extractCompanyCardWithVision(buffer);
    } catch (err) {
      logger.warn("GPT-4 Vision failed for company card, falling back to Tesseract", err);
    }
  }
  // Basic Tesseract fallback for company card
  const rawText = await extractTextFromImage(buffer);
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const data: CompanyCardExtractedData = { rawText: rawText.slice(0, 2000) };
  // Heuristic: look for registration number, PAN, company name
  for (const line of lines) {
    if (!data.registrationNumber && /regd?\s*\.?\s*no|registration\s*no|reg\.\s*no/i.test(line)) {
      data.registrationNumber = line.replace(/.*(?:regd?|registration)\s*\.?\s*no[.:\s]*/i, "").trim();
    }
    if (!data.panNumber && /\bpan\b/i.test(line)) {
      data.panNumber = line.replace(/.*\bpan\b[.:\s]*/i, "").trim();
    }
    if (!data.vatNumber && /\bvat\b/i.test(line)) {
      data.vatNumber = line.replace(/.*\bvat\b[.:\s]*/i, "").trim();
    }
  }
  const hasAny = Boolean(data.registrationNumber ?? data.panNumber ?? data.vatNumber);
  return {
    extractedData: data,
    isValidCompanyCard: hasAny,
    extractionStatus: hasAny ? "success" : "invalid",
  };
}
