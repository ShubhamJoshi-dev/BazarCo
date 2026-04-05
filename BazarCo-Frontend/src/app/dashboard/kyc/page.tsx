"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, Upload, ExternalLink, Trash2, RefreshCw,
  Building2, IdCard, CheckCircle2, XCircle, Clock, Loader2,
  User, Calendar, MapPin, Hash, Phone, Mail, Briefcase,
} from "lucide-react";
import {
  getKycStatus, uploadKycDocument, deleteKycDocument,
  type KycStatusResponse, type KycDocumentType, type KycDocument,
  type NepalIdExtractedData, type CompanyCardExtractedData,
} from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

// ─── helpers ────────────────────────────────────────────────────────────────

function isNepalId(data: unknown): data is NepalIdExtractedData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Boolean(d["नाम"] ?? d.name ?? d["नागरिकता_नम्बर"] ?? d.citizenshipNumber ?? d["जन्म_मिति"] ?? d.dateOfBirth);
}

function isCompanyCard(data: unknown): data is CompanyCardExtractedData {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return Boolean(d.companyName ?? d.registrationNumber ?? d.panNumber ?? d.vatNumber);
}

function clean(v: unknown): string {
  if (v == null) return "";
  return String(v).replace(/^["']|["']$/g, "").trim();
}

// ─── Status pill ─────────────────────────────────────────────────────────────

function KycStatusBadge({ kycVerified, status }: { kycVerified: boolean; status: string }) {
  if (kycVerified) {
    return (
      <div className="clay-card p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(34,197,94,0.3)", background: "rgba(34,197,94,0.08)" }}>
        <span className="w-12 h-12 flex items-center justify-center rounded-2xl shrink-0"
          style={{ background: "rgba(34,197,94,0.15)", boxShadow: "0 4px 16px rgba(34,197,94,0.25)" }}>
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
        </span>
        <div>
          <p className="font-black text-[var(--foreground)]">KYC Verified</p>
          <p className="text-sm text-[var(--brand-muted)]">Your identity is verified. You can add and manage products.</p>
        </div>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="clay-card p-4 flex items-center gap-4"
        style={{ borderColor: "rgba(255,92,114,0.3)", background: "rgba(255,92,114,0.08)" }}>
        <span className="w-12 h-12 flex items-center justify-center rounded-2xl shrink-0"
          style={{ background: "rgba(255,92,114,0.15)", boxShadow: "var(--clay-shadow-red)" }}>
          <XCircle className="w-6 h-6 text-[var(--brand-red)]" />
        </span>
        <div>
          <p className="font-black text-[var(--foreground)]">KYC Rejected</p>
          <p className="text-sm text-[var(--brand-muted)]">Your documents were not approved. Please upload valid documents and resubmit.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="clay-card p-4 flex items-center gap-4"
      style={{ borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)" }}>
      <span className="w-12 h-12 flex items-center justify-center rounded-2xl shrink-0"
        style={{ background: "rgba(245,158,11,0.15)", boxShadow: "0 4px 16px rgba(245,158,11,0.25)" }}>
        <Clock className="w-6 h-6 text-amber-400" />
      </span>
      <div>
        <p className="font-black text-[var(--foreground)]">Pending Verification</p>
        <p className="text-sm text-[var(--brand-muted)]">Upload your documents. An admin will review and verify your account.</p>
      </div>
    </div>
  );
}

// ─── Nepal ID extraction display ─────────────────────────────────────────────

function NepalIdFields({ data }: { data: NepalIdExtractedData }) {
  function displayName(raw: string): string {
    let s = clean(raw).replace(/^धर\s*:\s*/i, "").trim();
    const idx = s.search(/लिङ्ग/i);
    if (idx >= 0) s = s.slice(0, idx).trim();
    return s || clean(raw);
  }

  function formatDob(raw: string): string {
    const cleaned = clean(raw);
    const parts = cleaned.split(/[\s\-/.]+/).filter(Boolean);
    if (parts.length >= 3) {
      const [y, m, d] = parts;
      return `साल: ${y}  महिना: ${m}  गते: ${d}`;
    }
    return cleaned;
  }

  const rows: { label: string; icon: typeof User; value: string }[] = [];
  const nameRaw = data["नाम"] ?? data.name;
  if (nameRaw) rows.push({ label: "नाम (Name)", icon: User, value: displayName(String(nameRaw)) });
  const dobRaw = data["जन्म_मिति"] ?? data.dateOfBirth;
  if (dobRaw) rows.push({ label: "जन्म मिति (Date of Birth)", icon: Calendar, value: formatDob(String(dobRaw)) });
  const cit = clean(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber ?? "").replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, "");
  if (cit) rows.push({ label: "नागरिकता नम्बर", icon: Hash, value: cit });
  const dist = clean(data["जिल्ला"] ?? data.district ?? "");
  if (dist && !/^EER\s*sore$/i.test(dist)) rows.push({ label: "जिल्ला (District)", icon: MapPin, value: dist });
  const father = clean(data["पिताको_नाम"] ?? data.fatherName ?? "");
  if (father) rows.push({ label: "पिताको नाम", icon: User, value: father });
  const mother = clean(data["आमाको_नाम"] ?? data.motherName ?? "");
  if (mother) rows.push({ label: "आमाको नाम", icon: User, value: mother });
  const addr = clean(data["ठेगाना"] ?? data.address ?? "");
  if (addr) rows.push({ label: "ठेगाना (Address)", icon: MapPin, value: addr });
  const gender = clean(data["लिङ्ग"] ?? data.gender ?? "");
  if (gender) rows.push({ label: "लिङ्ग (Gender)", icon: User, value: gender });

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map(({ label, icon: Icon, value }) => (
        <div key={label} className="clay-card px-4 py-3 flex items-start gap-3" style={{ borderRadius: 14 }}>
          <span className="w-7 h-7 flex items-center justify-center rounded-xl shrink-0 mt-0.5"
            style={{ background: "rgba(77,166,255,0.12)" }}>
            <Icon className="w-3.5 h-3.5 text-[var(--brand-blue)]" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] break-words">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Company card extraction display ─────────────────────────────────────────

function CompanyCardFields({ data }: { data: CompanyCardExtractedData }) {
  const rows: { label: string; icon: typeof User; value: string }[] = [];
  if (data.companyName) rows.push({ label: "Company Name", icon: Building2, value: data.companyName });
  if (data.companyType) rows.push({ label: "Company Type", icon: Briefcase, value: data.companyType });
  if (data.registrationNumber) rows.push({ label: "Registration Number", icon: Hash, value: data.registrationNumber });
  if (data.panNumber) rows.push({ label: "PAN Number", icon: Hash, value: data.panNumber });
  if (data.vatNumber) rows.push({ label: "VAT Number", icon: Hash, value: data.vatNumber });
  if (data.address) rows.push({ label: "Registered Address", icon: MapPin, value: data.address });
  if (data.registeredDate) rows.push({ label: "Registration Date", icon: Calendar, value: data.registeredDate });
  if (data.ownerName) rows.push({ label: "Owner / Proprietor", icon: User, value: data.ownerName });
  if (data.contactPhone) rows.push({ label: "Phone", icon: Phone, value: data.contactPhone });
  if (data.contactEmail) rows.push({ label: "Email", icon: Mail, value: data.contactEmail });

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map(({ label, icon: Icon, value }) => (
        <div key={label} className="clay-card px-4 py-3 flex items-start gap-3" style={{ borderRadius: 14 }}>
          <span className="w-7 h-7 flex items-center justify-center rounded-xl shrink-0 mt-0.5"
            style={{ background: "rgba(255,92,114,0.12)" }}>
            <Icon className="w-3.5 h-3.5 text-[var(--brand-red)]" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-[var(--foreground)] break-words">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Document detail panel ───────────────────────────────────────────────────

function DocumentDetailPanel({
  doc,
  kycVerified,
  kycStatus,
}: {
  doc: KycDocument;
  kycVerified: boolean;
  kycStatus: string;
}) {
  const data = doc.extractedData;
  const status = doc.extractionStatus ?? "pending";
  const isValid = doc.isValidNationalId;
  const isNationalCard = doc.documentType === "national_card";

  const extractionLabel =
    status === "pending" ? "Extracting data…"
    : status === "success" && isValid ? (isNationalCard ? "Valid Nepal ID" : "Valid Document")
    : status === "success" && !isValid ? "Not a valid document"
    : status === "failed" ? "Extraction failed"
    : "Invalid document";

  const extractionColor =
    status === "success" && isValid ? "#22c55e"
    : status === "invalid" || (status === "success" && !isValid) ? "#ff5c72"
    : status === "failed" ? "#f59e0b"
    : "#71717a";

  return (
    <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
      className="clay-card overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--brand-border)] flex items-center gap-3">
        <span className="w-9 h-9 flex items-center justify-center rounded-2xl shrink-0"
          style={{ background: isNationalCard ? "rgba(77,166,255,0.12)" : "rgba(255,92,114,0.12)" }}>
          {isNationalCard
            ? <IdCard className="w-4 h-4 text-[var(--brand-blue)]" />
            : <Building2 className="w-4 h-4 text-[var(--brand-red)]" />}
        </span>
        <div>
          <p className="font-black text-[var(--foreground)] text-sm">
            {isNationalCard ? "National Identity Card" : "Company Registration Card"}
          </p>
          {doc.uploadedAt && (
            <p className="text-[10px] text-[var(--brand-muted)]">
              Uploaded {new Date(doc.uploadedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
            </p>
          )}
        </div>
      </div>

      {/* Document image */}
      <div className="aspect-[4/3] relative bg-[var(--brand-border)]/30">
        <Image src={doc.fileUrl} alt="Document" fill className="object-contain" sizes="(max-width: 768px) 100vw, 400px" />
      </div>

      <div className="p-5 space-y-4">
        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border"
            style={{
              background: kycVerified ? "rgba(34,197,94,0.12)" : kycStatus === "rejected" ? "rgba(255,92,114,0.12)" : "rgba(245,158,11,0.12)",
              color: kycVerified ? "#22c55e" : kycStatus === "rejected" ? "#ff5c72" : "#f59e0b",
              borderColor: kycVerified ? "rgba(34,197,94,0.3)" : kycStatus === "rejected" ? "rgba(255,92,114,0.3)" : "rgba(245,158,11,0.3)",
            }}>
            {kycVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
            {kycVerified ? "KYC Verified" : kycStatus === "rejected" ? "Rejected" : "Pending Review"}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border"
            style={{
              background: `${extractionColor}18`,
              color: extractionColor,
              borderColor: `${extractionColor}40`,
            }}>
            {status === "pending" ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : status === "success" && isValid ? <CheckCircle2 className="w-3.5 h-3.5" />
              : <XCircle className="w-3.5 h-3.5" />}
            {extractionLabel}
          </span>
        </div>

        {/* Validation error messages */}
        {status === "invalid" && (
          <div className="clay-card px-4 py-3" style={{ borderRadius: 14, borderColor: "rgba(255,92,114,0.3)", background: "rgba(255,92,114,0.08)" }}>
            <p className="text-sm text-[var(--brand-red)]">
              {isNationalCard
                ? "This does not appear to be a valid Nepal national identity card (राष्ट्रिय परिचयपत्र). Please upload a clear front-facing photo of your ID."
                : "This does not appear to be a valid company registration document. Please upload a clear image of your company registration card or PAN certificate."}
            </p>
          </div>
        )}
        {status === "failed" && doc.extractionError && (
          <div className="clay-card px-4 py-3" style={{ borderRadius: 14, borderColor: "rgba(245,158,11,0.3)", background: "rgba(245,158,11,0.08)" }}>
            <p className="text-sm text-amber-400">{doc.extractionError}</p>
          </div>
        )}

        {/* Extracted data */}
        {data && isNepalId(data) && (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-muted)]">Extracted Information</p>
            <NepalIdFields data={data} />
          </div>
        )}
        {data && isCompanyCard(data) && (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-muted)]">Extracted Information</p>
            <CompanyCardFields data={data} />
          </div>
        )}

        {/* View full document link */}
        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
          className="clay-btn-blue w-full py-2.5 text-sm flex items-center justify-center gap-2 opacity-80">
          <ExternalLink className="w-4 h-4" /> View Full Document
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function KycPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const [kyc, setKyc] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState<KycDocumentType>("national_card");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [replaceDocType, setReplaceDocType] = useState<KycDocumentType | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  const isSeller = user?.role === "seller";

  const fetchKyc = useCallback(async () => {
    if (!isSeller) return;
    setLoading(true);
    const data = await getKycStatus();
    setKyc(data ?? null);
    if (data?.documents?.length) {
      setSelectedDocId((prev) => {
        const exists = prev && data.documents.some((d) => d.id === prev);
        return exists ? prev : data.documents[0].id;
      });
    }
    setLoading(false);
  }, [isSeller]);

  useEffect(() => { fetchKyc(); }, [fetchKyc]);

  const hasShownVerifiedToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("verified") !== "1" || hasShownVerifiedToast.current) return;
    hasShownVerifiedToast.current = true;
    toast.success("KYC verified. You can now add products.");
    window.history.replaceState({}, "", "/dashboard/kyc");
  }, [searchParams, toast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) { setError("Please choose an image (JPEG, PNG, WebP, GIF)."); return; }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !isSeller) return;
    setError(null);
    setUploading(true);
    const result = await uploadKycDocument(documentType, selectedFile);
    setUploading(false);
    if (result.success) {
      toast.success("Document uploaded and analyzed. Details shown below.");
      setSelectedFile(null);
      setReplaceDocType(null);
      fetchKyc();
    } else {
      setError(result.message ?? "Upload failed.");
      toast.error(result.message ?? "Upload failed.");
    }
  };

  const handleRemove = async (documentId: string) => {
    if (!isSeller || deletingId) return;
    setDeletingId(documentId);
    const result = await deleteKycDocument(documentId);
    setDeletingId(null);
    if (result.success) {
      toast.success("Document removed.");
      fetchKyc();
    } else {
      toast.error(result.message ?? "Could not remove document.");
    }
  };

  const handleReplace = (doc: { id: string; documentType: string }) => {
    setDocumentType(doc.documentType as KycDocumentType);
    setReplaceDocType(doc.documentType as KycDocumentType);
    setSelectedFile(null);
    setError(null);
  };

  const selectedDoc = kyc?.documents?.find((d) => d.id === selectedDocId) ?? kyc?.documents?.[0];

  if (!isSeller) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="clay-card p-16 text-center">
        <ShieldCheck className="mx-auto w-14 h-14 text-[var(--brand-muted)]/30 mb-5" />
        <p className="text-xl font-black text-[var(--foreground)] mb-2">Seller Only</p>
        <p className="text-sm text-[var(--brand-muted)]">KYC verification is for sellers. As a buyer, you can browse and shop without KYC.</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="clay-card p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-blue)]/8 to-transparent pointer-events-none rounded-[24px]" />
        <div className="relative">
          <h1 className="text-2xl font-black text-[var(--foreground)] flex items-center gap-3">
            <span className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[var(--brand-blue)]/15 text-[var(--brand-blue)]"
              style={{ boxShadow: "var(--clay-shadow-blue)" }}>
              <ShieldCheck className="w-5 h-5" />
            </span>
            KYC Verification
          </h1>
          <p className="text-sm text-[var(--brand-muted)] mt-1">
            Verify your identity to unlock product listing. Upload your national ID or company registration card.
          </p>
        </div>
      </motion.div>

      {loading ? (
        <div className="clay-card p-16 flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[var(--brand-blue)] animate-spin" />
          <p className="text-sm text-[var(--brand-muted)]">Loading KYC status…</p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left column */}
          <div className="flex-1 min-w-0 space-y-5 max-w-2xl">
            {/* Status */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <KycStatusBadge kycVerified={kyc?.kycVerified ?? false} status={kyc?.status ?? "pending"} />
            </motion.div>

            {/* Upload form */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="clay-card p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-9 h-9 flex items-center justify-center rounded-2xl bg-[var(--brand-red)]/12 text-[var(--brand-red)]">
                  <Upload className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-black text-[var(--foreground)]">
                  {replaceDocType ? `Replace ${replaceDocType.replace("_", " ")}` : "Upload Document"}
                </h2>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                      className="clay-card px-4 py-3 text-sm text-[var(--brand-red)]"
                      style={{ borderRadius: 14, borderColor: "rgba(255,92,114,0.3)", background: "rgba(255,92,114,0.08)" }}>
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Document type picker */}
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { v: "national_card", label: "National ID Card", icon: IdCard, color: "blue" },
                    { v: "company_card",  label: "Company Card",     icon: Building2, color: "red"  },
                  ] as const).map(({ v, label, icon: Icon, color }) => {
                    const active = documentType === v;
                    return (
                      <motion.button key={v} type="button" onClick={() => setDocumentType(v)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className={`clay-card p-4 flex flex-col items-center gap-2 text-xs font-bold transition-all ${active ? "" : "opacity-60"}`}
                        style={active ? {
                          borderColor: color === "blue" ? "rgba(77,166,255,0.4)" : "rgba(255,92,114,0.4)",
                          background: color === "blue" ? "rgba(77,166,255,0.08)" : "rgba(255,92,114,0.08)",
                        } : {}}>
                        <span className="w-10 h-10 flex items-center justify-center rounded-2xl"
                          style={{ background: color === "blue" ? "rgba(77,166,255,0.12)" : "rgba(255,92,114,0.12)" }}>
                          <Icon className={`w-5 h-5 ${color === "blue" ? "text-[var(--brand-blue)]" : "text-[var(--brand-red)]"}`} />
                        </span>
                        <span className="text-[var(--foreground)] text-center">{label}</span>
                        {active && <CheckCircle2 className={`w-4 h-4 ${color === "blue" ? "text-[var(--brand-blue)]" : "text-[var(--brand-red)]"}`} />}
                      </motion.button>
                    );
                  })}
                </div>

                {/* File picker */}
                <label className="clay-card flex items-center gap-4 p-4 cursor-pointer transition-all hover:border-[var(--brand-blue)]/40"
                  style={{ borderRadius: 16, borderStyle: "dashed" }}>
                  <span className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[var(--brand-blue)]/10 shrink-0">
                    <Upload className="w-4 h-4 text-[var(--brand-blue)]" />
                  </span>
                  <span className="text-sm text-[var(--brand-muted)] flex-1 min-w-0 truncate">
                    {selectedFile ? selectedFile.name : "Choose image (JPEG, PNG, WebP, max 5MB)"}
                  </span>
                  <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </label>

                <motion.button type="submit"
                  disabled={uploading || !selectedFile}
                  whileHover={!uploading && selectedFile ? { scale: 1.01 } : {}}
                  whileTap={!uploading && selectedFile ? { scale: 0.98 } : {}}
                  className="clay-btn-red w-full py-3.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing document…</> : <><Upload className="w-4 h-4" /> Upload & Analyze</>}
                </motion.button>

                <p className="text-[10px] text-center text-[var(--brand-muted)]">
                  {documentType === "national_card"
                    ? "Upload a clear front photo of your Nepal national ID card (राष्ट्रिय परिचयपत्र)"
                    : "Upload your company registration certificate or PAN/VAT card"}
                </p>
              </form>
            </motion.div>

            {/* Uploaded documents list */}
            {kyc && kyc.documents.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="clay-card p-5">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--brand-muted)] mb-4">
                  Uploaded Documents ({kyc.documents.length})
                </p>
                <ul className="space-y-3">
                  {kyc.documents.map((doc) => {
                    const isNat = doc.documentType === "national_card";
                    const statusColor =
                      doc.extractionStatus === "success" && doc.isValidNationalId ? "#22c55e"
                      : doc.extractionStatus === "invalid" ? "#ff5c72"
                      : "#f59e0b";
                    return (
                      <motion.li key={doc.id}
                        role="button" tabIndex={0}
                        onClick={() => setSelectedDocId(doc.id)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedDocId(doc.id)}
                        whileHover={{ x: 4 }}
                        className={`clay-card p-3 flex items-center gap-4 cursor-pointer transition-all ${
                          selectedDocId === doc.id ? "" : "opacity-70 hover:opacity-100"
                        }`}
                        style={selectedDocId === doc.id ? {
                          borderColor: isNat ? "rgba(77,166,255,0.4)" : "rgba(255,92,114,0.4)",
                          background: isNat ? "rgba(77,166,255,0.06)" : "rgba(255,92,114,0.06)",
                        } : {}}>
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--brand-border)] shrink-0 relative"
                          style={{ boxShadow: "var(--clay-shadow-neutral)" }}>
                          <Image src={doc.fileUrl} alt={doc.documentType} fill className="object-cover" sizes="56px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isNat ? <IdCard className="w-3.5 h-3.5 text-[var(--brand-blue)]" /> : <Building2 className="w-3.5 h-3.5 text-[var(--brand-red)]" />}
                            <p className="text-sm font-bold text-[var(--foreground)] capitalize">
                              {doc.documentType.replace("_", " ")}
                            </p>
                          </div>
                          {doc.uploadedAt && (
                            <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          )}
                          <span className="inline-block mt-1 text-[10px] font-bold rounded-full px-2 py-0.5"
                            style={{ background: `${statusColor}18`, color: statusColor }}>
                            {doc.extractionStatus === "success" && doc.isValidNationalId ? "Valid"
                              : doc.extractionStatus === "invalid" ? "Invalid"
                              : doc.extractionStatus === "pending" ? "Processing…"
                              : "Check required"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleReplace(doc); }}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--brand-muted)] hover:text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10 transition-all">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button type="button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); handleRemove(doc.id); }}
                            disabled={deletingId === doc.id}
                            className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--brand-muted)] hover:text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition-all disabled:opacity-40">
                            {deletingId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </motion.button>
                        </div>
                      </motion.li>
                    );
                  })}
                </ul>
              </motion.div>
            )}
          </div>

          {/* Right column: document detail panel */}
          <div className="w-full lg:w-[400px] shrink-0 lg:sticky lg:top-4">
            <AnimatePresence mode="wait">
              {selectedDoc ? (
                <DocumentDetailPanel key={selectedDoc.id} doc={selectedDoc}
                  kycVerified={kyc?.kycVerified ?? false} kycStatus={kyc?.status ?? "pending"} />
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="clay-card p-16 text-center">
                  <ShieldCheck className="mx-auto w-12 h-12 text-[var(--brand-muted)]/30 mb-4" />
                  <p className="text-sm text-[var(--brand-muted)]">
                    {kyc?.documents?.length === 0
                      ? "Upload a document to see extracted details here."
                      : "Select a document to view details."}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
