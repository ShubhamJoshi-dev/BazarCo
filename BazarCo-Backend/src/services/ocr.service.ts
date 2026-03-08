import { createWorker } from "tesseract.js";
import type { NepalIdExtractedData } from "../models/document.model";
import { logger } from "../lib/logger";

/** Extract text from image buffer using Tesseract (Nepali + English for Nepal ID). */
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

/** Known garbage OCR for district – do not store. */
const SKIP_DISTRICT_VALUES = /^EER\s*sore$/i;

/** Nepal national ID common labels (Nepali) and possible English variants. */
const LABELS = {
  name: ["नाम", "name", "Name", "NAM"],
  dateOfBirth: ["जन्म मिति", "जन्ममिति", "date of birth", "Date of Birth", "DOB", "जन्म मिति"],
  citizenshipNumber: ["नागरिकता नम्बर", "नागरिकता नं", "citizenship no", "Citizenship Number", "नं"],
  district: ["जिल्ला", "district", "District", "Jilla"],
  fatherName: ["पिताको नाम", "पिताकोनाम", "father's name", "Father's Name"],
  motherName: ["आमाको नाम", "आमाकोनाम", "mother's name", "Mother's Name"],
  address: ["ठेगाना", "address", "Address", "Permanent Address"],
  gender: ["लिङ्ग", "gender", "Gender", "Sex"],
};

/** Parse DOB line to साल, महिना, गते in order. Rebuild clean "साल महिना गते" string. */
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

/** Split "धर: सुजल अधिकारी लिङ्ग "पुरुष" → name "सुजल अधिकारी", gender "पुरुष". */
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
      // keep only common gender values if rest is noise
      const g = gender.toLowerCase();
      if (g === "पुरुष" || g === "महिला" || g === "male" || g === "female" || g === "other" || gender === "पुरुष" || gender === "महिला") {
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

/** Parse raw OCR text into structured Nepal ID data. */
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
    if (nameFinal) {
      out["नाम"] = nameFinal;
      out.name = nameFinal;
    }
    if (genderFromName) {
      out["लिङ्ग"] = genderFromName;
      out.gender = genderFromName;
    }
  }
  const dob = valueAfter(LABELS.dateOfBirth);
  if (dob) {
    const normalized = normalizeDob(dob);
    if (normalized) {
      out["जन्म_मिति"] = normalized;
      out.dateOfBirth = normalized;
    }
  }
  const citizenship = valueAfter(LABELS.citizenshipNumber);
  if (citizenship) {
    const c = cleanExtracted(citizenship).replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, "");
    if (c) {
      out["नागरिकता_नम्बर"] = c;
      out.citizenshipNumber = c;
    }
  }
  const district = valueAfter(LABELS.district);
  if (district) {
    const d = cleanExtracted(district);
    if (d && d.length < 100 && !SKIP_DISTRICT_VALUES.test(d)) {
      out["जिल्ला"] = d;
      out.district = d;
    }
  }
  const father = valueAfter(LABELS.fatherName);
  if (father) {
    const f = cleanExtracted(father);
    if (f) {
      out["पिताको_नाम"] = f;
      out.fatherName = f;
    }
  }
  const mother = valueAfter(LABELS.motherName);
  if (mother) {
    const m = cleanExtracted(mother);
    if (m) {
      out["आमाको_नाम"] = m;
      out.motherName = m;
    }
  }
  const address = valueAfter(LABELS.address);
  if (address) {
    const a = cleanExtracted(address);
    if (a) {
      out["ठेगाना"] = a;
      out.address = a;
    }
  }
  const gender = valueAfter(LABELS.gender);
  if (gender) {
    const g = cleanExtracted(gender);
    if (g && !out["लिङ्ग"]) {
      out["लिङ्ग"] = g;
      out.gender = g;
    }
  }

  return out;
}

/** Check if extracted data looks like a valid Nepal national ID (has at least some key fields). */
export function isValidNepalNationalId(data: NepalIdExtractedData): boolean {
  const hasName = Boolean(data["नाम"] ?? data.name);
  const hasDob = Boolean(data["जन्म_मिति"] ?? data.dateOfBirth);
  const hasCitizenship = Boolean(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber);
  const hasDistrict = Boolean(data["जिल्ला"] ?? data.district);
  const hasAnyKeyField = hasName || hasDob || hasCitizenship || hasDistrict;
  const hasNepaliOrIdLike = Boolean(
    data.rawText &&
    (data.rawText.includes("नाम") ||
      data.rawText.includes("जन्म") ||
      data.rawText.includes("नागरिकता") ||
      data.rawText.includes("परिचय") ||
      /\d{6,}/.test(data.rawText))
  );
  return hasAnyKeyField || hasNepaliOrIdLike;
}

/** Run OCR on image buffer and return extracted Nepal ID data + validation. */
export async function extractNepalNationalId(buffer: Buffer): Promise<{
  extractedData: NepalIdExtractedData;
  isValidNationalId: boolean;
  extractionStatus: "success" | "invalid";
}> {
  const rawText = await extractTextFromImage(buffer);
  const extractedData = parseNepalNationalIdText(rawText);
  const isValidNationalId = isValidNepalNationalId(extractedData);
  return {
    extractedData,
    isValidNationalId,
    extractionStatus: isValidNationalId ? "success" : "invalid",
  };
}
