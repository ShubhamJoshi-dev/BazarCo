"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Upload, ExternalLink, Trash2, RefreshCw } from "lucide-react";
import { getKycStatus, uploadKycDocument, deleteKycDocument, type KycStatusResponse, type KycDocumentType, type KycDocument, type NepalIdExtractedData } from "@/lib/api";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

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

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  const hasShownVerifiedToast = useRef(false);
  const hasShownInvalidIdToast = useRef(false);
  useEffect(() => {
    if (searchParams.get("verified") !== "1" || hasShownVerifiedToast.current) return;
    hasShownVerifiedToast.current = true;
    toast.success("KYC verified. The seller can now add products.");
    window.history.replaceState({}, "", "/dashboard/kyc");
  }, [searchParams]);

  useEffect(() => {
    if (!kyc?.documents?.length || hasShownInvalidIdToast.current) return;
    const invalidNational = kyc.documents.find(
      (d) =>
        d.documentType === "national_card" &&
        (d.extractionStatus === "invalid" || (d.extractionStatus === "success" && d.isValidNationalId === false))
    );
    if (invalidNational) {
      hasShownInvalidIdToast.current = true;
      toast.error("Please upload a valid national identity card (राष्ट्रिय परिचयपत्र). This image does not appear to be a Nepal national ID.");
    }
  }, [kyc?.documents, toast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please choose an image (JPEG, PNG, WebP, GIF).");
        return;
      }
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
      toast.success(
        documentType === "national_card"
          ? "Document uploaded. Extracted details are shown below."
          : (result.message ?? "Document uploaded. Admin will verify your KYC.")
      );
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
  const hasPendingExtraction = kyc?.documents?.some((d) => d.extractionStatus === "pending") ?? false;

  useEffect(() => {
    if (!isSeller) return;
    if (kyc?.kycVerified) document.title = "KYC ✓ Verified | BazarCo";
    else if (hasPendingExtraction) document.title = "KYC - Processing... | BazarCo";
    else document.title = "KYC Verification | BazarCo";
    return () => { document.title = "BazarCo"; };
  }, [isSeller, kyc?.kycVerified, hasPendingExtraction]);

  if (!isSeller) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
        <ShieldCheck className="mx-auto w-14 h-14 text-neutral-500 mb-4" />
        <p className="text-[var(--brand-white)] font-medium mb-1">Seller only</p>
        <p className="text-sm text-neutral-400">KYC verification is for sellers. As a buyer, you can browse and shop without KYC.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
      <div className="space-y-6 max-w-2xl flex-shrink-0">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-[var(--brand-white)]">KYC Verification</h1>
          {kyc?.kycVerified && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-1 text-sm font-medium text-emerald-400">
              <ShieldCheck className="w-4 h-4" aria-hidden />
              Verified
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-400">
          To add products, you must verify your identity with a national ID card or company card. Upload a clear image; our admin will verify and enable your seller account.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-neutral-400">Loading KYC status...</p>
        </div>
      ) : (
        <>
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border p-4 flex items-center gap-3 ${
              kyc?.kycVerified
                ? "border-emerald-500/40 bg-emerald-500/10"
                : kyc?.status === "rejected"
                  ? "border-[var(--brand-red)]/40 bg-[var(--brand-red)]/10"
                  : "border-amber-500/40 bg-amber-500/10"
            }`}
          >
            {kyc?.kycVerified ? (
              <ShieldCheck className="w-10 h-10 text-emerald-400 shrink-0" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-amber-400 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-[var(--brand-white)]">
                {kyc?.kycVerified ? "Verified" : kyc?.status === "rejected" ? "Rejected" : "Pending verification"}
              </p>
              <p className="text-sm text-neutral-400">
                {kyc?.kycVerified
                  ? "You can add and manage products."
                  : kyc?.status === "rejected"
                    ? "Your documents were not approved. You can upload again."
                    : "Upload a document and wait for admin to verify. Verification email is sent to admin."}
              </p>
            </div>
          </motion.div>

          {/* Upload form - always show so verified users can add or replace documents */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="settings-card rounded-xl border border-white/10 p-6"
          >
            <h2 className="text-lg font-semibold text-[var(--brand-white)] mb-4">
              {replaceDocType ? `Replace ${replaceDocType.replace("_", " ")}` : kyc?.kycVerified ? "Add another document" : "Add document"}
            </h2>
            <p className="text-sm text-neutral-400 mb-4">
              {kyc?.kycVerified
                ? "Upload an additional national ID or company card. You can also remove existing documents below."
                : <>Upload a clear image of your <strong>national ID card</strong> or <strong>company card</strong>. It will be stored securely (Cloudinary + our database) and sent to admin for verification.</>}
            </p>
              <form onSubmit={handleUpload} className="space-y-4">
                {error && (
                  <p className="text-sm text-[var(--brand-red)] bg-[var(--brand-red)]/10 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}
                <div>
                  <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Document type</label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as KycDocumentType)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-[var(--brand-white)] focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/30"
                  >
                    <option value="national_card">National ID card</option>
                    <option value="company_card">Company card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--brand-white)] mb-1">Document image</label>
                  <label className="flex items-center gap-4 rounded-xl border border-dashed border-white/20 bg-white/5 px-4 py-3 cursor-pointer hover:bg-white/10 transition-colors">
                    <Upload className="w-5 h-5 text-neutral-400 shrink-0" />
                    <span className="text-sm text-neutral-400">
                      {selectedFile ? selectedFile.name : "Choose image (JPEG, PNG, WebP, GIF, max 5MB)"}
                    </span>
                    <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="w-full rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-red)]/90 disabled:opacity-50 transition-colors"
                >
                  {uploading ? "Uploading…" : "Upload document"}
                </button>
              </form>
            </motion.div>

          {/* Uploaded documents list */}
          {kyc && kyc.documents.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="settings-card rounded-xl border border-white/10 p-6"
            >
              <h2 className="text-lg font-semibold text-[var(--brand-white)] mb-4">Uploaded documents</h2>
              <ul className="space-y-3">
                {kyc.documents.map((doc) => (
                  <li
                    key={doc.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedDocId(doc.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedDocId(doc.id)}
                    className={`flex items-center gap-4 rounded-lg border p-3 cursor-pointer transition-colors ${
                      selectedDocId === doc.id
                        ? "border-[var(--brand-blue)]/50 bg-[var(--brand-blue)]/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 shrink-0 relative">
                      <Image
                        src={doc.fileUrl}
                        alt={doc.documentType}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--brand-white)] capitalize">
                        {doc.documentType.replace("_", " ")}
                      </p>
                      {doc.uploadedAt && (
                        <p className="text-xs text-neutral-500">
                          Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleReplace(doc); }}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-[var(--brand-blue)] transition-colors"
                        title="Replace document"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemove(doc.id); }}
                        disabled={deletingId === doc.id}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-[var(--brand-red)]/20 hover:text-[var(--brand-red)] transition-colors disabled:opacity-50"
                        title="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded-lg p-2 text-neutral-400 hover:bg-white/10 hover:text-[var(--brand-white)] transition-colors"
                        title="View document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </>
      )}
      </div>

      {/* Right panel: document details + extracted data (Nepali) */}
      <div className="flex-1 min-w-0 lg:max-w-md">
        {selectedDoc ? (
          <DocumentDetailPanel
            doc={selectedDoc}
            kycVerified={kyc?.kycVerified ?? false}
            kycStatus={kyc?.status ?? "pending"}
          />
        ) : kyc?.documents?.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-neutral-500 text-sm">Upload a document to see extracted details here.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-center">
            <p className="text-neutral-500 text-sm">Select a document to view details.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function DocumentDetailPanel({
  doc,
  kycVerified,
  kycStatus,
}: {
  doc: KycDocument;
  kycVerified: boolean;
  kycStatus: string;
}) {
  const data = doc.extractedData as NepalIdExtractedData | undefined | null;
  const status = doc.extractionStatus ?? "pending";
  const isValid = doc.isValidNationalId;

  function cleanValue(v: string | undefined): string {
    if (v == null) return "";
    return String(v).replace(/^["']|["']$/g, "").trim();
  }

  /** Parse DOB into साल, महिना, गते for display. Handles २०६०-०९-०२, 2060/09/02, 2060 09 02, etc. */
  function formatDobNepali(raw: string): string {
    const cleaned = cleanValue(raw);
    const parts = cleaned.split(/[\s\-/.]+/).filter(Boolean);
    if (parts.length >= 3) {
      const [y, m, d] = parts;
      return `साल: ${y} महिना: ${m} गते: ${d}`;
    }
    return cleaned;
  }

  /** Display-only: strip धर: and everything from लिङ्ग so name shows clean even if backend sent old data. */
  function displayName(raw: string): string {
    let s = cleanValue(raw).replace(/^धर\s*:\s*/i, "").trim();
    const idx = s.search(/लिङ्ग/i);
    if (idx >= 0) s = s.slice(0, idx).replace(/\s+$/, "");
    return s.trim() || cleanValue(raw);
  }

  const rows: { label: string; value: string }[] = [];
  if (data) {
    const nameRaw = data["नाम"] ?? data.name;
    const nameVal = nameRaw ? displayName(String(nameRaw)) : "";
    if (nameVal) rows.push({ label: "नाम", value: nameVal });
    const dobRaw = data["जन्म_मिति"] ?? data.dateOfBirth;
    if (dobRaw) rows.push({ label: "जन्म मिति", value: formatDobNepali(String(dobRaw)) });
    const citizenshipVal = cleanValue(data["नागरिकता_नम्बर"] ?? data.citizenshipNumber)
      .replace(/^[\s.\-–—]+|[\s.\-–—]+$/g, "");
    if (citizenshipVal) rows.push({ label: "नागरिकता नम्बर", value: citizenshipVal });
    const districtVal = cleanValue(data["जिल्ला"] ?? data.district);
    if (districtVal && !/^EER\s*sore$/i.test(districtVal)) rows.push({ label: "जिल्ला", value: districtVal });
    const fatherVal = cleanValue(data["पिताको_नाम"] ?? data.fatherName);
    if (fatherVal) rows.push({ label: "पिताको नाम", value: fatherVal });
    const motherVal = cleanValue(data["आमाको_नाम"] ?? data.motherName);
    if (motherVal) rows.push({ label: "आमाको नाम", value: motherVal });
    const addressVal = cleanValue(data["ठेगाना"] ?? data.address);
    if (addressVal) rows.push({ label: "ठेगाना", value: addressVal });
    const genderRaw = data["लिङ्ग"] ?? data.gender;
    const genderVal = genderRaw ? cleanValue(String(genderRaw)).replace(/^["']|["']$/g, "") : "";
    if (genderVal) rows.push({ label: "लिङ्ग", value: genderVal });
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden"
    >
      <div className="p-4 border-b border-white/10">
        <h2 className="text-lg font-semibold text-[var(--brand-white)]">Document details</h2>
        <p className="text-xs text-neutral-500 capitalize mt-0.5">{doc.documentType.replace("_", " ")}</p>
      </div>
      <div className="aspect-[4/3] relative bg-white/5">
        <Image src={doc.fileUrl} alt="Document" fill className="object-contain" sizes="400px" />
      </div>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              kycVerified
                ? "bg-emerald-500/20 text-emerald-400"
                : kycStatus === "rejected"
                  ? "bg-red-500/20 text-red-400"
                  : "bg-amber-500/20 text-amber-400"
            }`}
          >
            {kycVerified ? "Verified" : kycStatus === "rejected" ? "Rejected" : "Pending verification"}
          </span>
          {doc.documentType === "national_card" && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                status === "success" && isValid
                  ? "bg-emerald-500/20 text-emerald-400"
                  : status === "invalid" || (status === "success" && !isValid)
                    ? "bg-red-500/20 text-red-400"
                    : status === "failed"
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-neutral-500/20 text-neutral-400"
              }`}
            >
              {status === "pending"
                ? "Extracting…"
                : status === "success" && isValid
                  ? "Valid Nepal ID"
                  : status === "success" && !isValid
                    ? "Not a valid Nepal ID"
                    : status === "failed"
                      ? "Extraction failed"
                      : "Invalid document"}
            </span>
          )}
        </div>

        {doc.documentType === "national_card" && status === "invalid" && (
          <p className="text-sm text-[var(--brand-red)] bg-[var(--brand-red)]/10 rounded-lg px-3 py-2">
            This does not appear to be a valid Nepal national identity card. Please upload a clear image of your राष्ट्रिय परिचयपत्र.
          </p>
        )}
        {doc.documentType === "national_card" && status === "failed" && doc.extractionError && (
          <p className="text-sm text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">{doc.extractionError}</p>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-[var(--brand-white)]">Extracted information (Nepali)</h3>
            <dl className="space-y-2">
              {rows.map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <dt className="text-xs text-neutral-500">{label}</dt>
                  <dd className="text-sm text-[var(--brand-white)] font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {doc.uploadedAt && (
          <p className="text-xs text-neutral-500">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
        )}
      </div>
    </motion.div>
  );
}
