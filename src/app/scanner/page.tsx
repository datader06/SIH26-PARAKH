"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import aadhaarExample from "@/assets/demo/aadhaar-example.png";
import { Dialog } from "@/components/ui/Dialog";
import { AppShell } from "@/components/layout/AppShell";
import {
  Scan,
  Camera,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Shield,
  Send,
  Zap,
  Check,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  QrCode,
  UserCheck,
  HelpCircle,
} from "lucide-react";

// Demo inputs are processed by the same OCR pipeline as user uploads.
const CALIBRATION_SPECIMENS = [
  {
    name: "Synthetic PAN Specimen (Income Tax Format)",
    type: "PAN_CARD",
    text: "INCOME TAX DEPARTMENT\nGOVT. OF INDIA\nPermanent Account Number Card\nABCPR8291K\nName: PRIYA NAIR\nFather's Name: RAMAN NAIR\nDate of Birth: 22/11/1992",
  },
  {
    name: "User-provided Aadhaar demo image",
    type: "AADHAAR_CARD",
    text: "", // The Aadhaar sample uses the supplied image, never a text reconstruction.
  },
  {
    name: "Synthetic Passport Specimen (ICAO 9303 MRZ Format)",
    type: "PASSPORT",
    text: "REPUBLIC OF INDIA / PASSPORT\nType: P Country Code: IND Passport No: Z8192039\nGiven Name: AMITABH Surname: DASGUPTA\nNationality: INDIAN Sex: M Date of Birth: 12/04/1978\nP<INDDASGUPTA<<AMITABH<<<<<<<<<<<<<<<<<<<<<<\nZ8192039<9IND7804128M2804112<<<<<<<<<<<<<<<4",
  },
  {
    name: "Synthetic Driving Licence Specimen (MoRTH Format)",
    type: "DRIVING_LICENCE",
    text: "UNION OF INDIA / DRIVING LICENCE\nTRANSPORT DEPARTMENT\nDL NO: DL-0420180029183\nName: MANPREET SINGH\nDOB: 10/05/1988\nValid Till: 15/06/2038\nCOV: LMV, MCWG",
  },
  {
    name: "Synthetic Voter ID Specimen (ECI EPIC Format)",
    type: "VOTER_ID",
    text: "ELECTION COMMISSION OF INDIA\nELECTOR PHOTO IDENTITY CARD\nWBF2910482\nElector's Name: KAVITA MEHTA\nFather's Name: SURESH MEHTA\nSex: FEMALE Age: 34",
  },
];

export default function ScannerPage() {
  const [activeTab, setActiveTab] = useState<
    "fields" | "forensics" | "face" | "mrz" | "raw"
  >("fields");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screeningResult, setScreeningResult] = useState<any | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [revealedPii, setRevealedPii] = useState(false);
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [revealJustification, setRevealJustification] = useState("");
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [parakhDispatchStatus, setParakhDispatchStatus] = useState<
    string | null
  >(null);

  // Biometric Live Selfie State
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [faceVerifyLoading, setFaceVerifyLoading] = useState(false);
  const [faceVerifyResult, setFaceVerifyResult] = useState<any | null>(null);

  // Video & Canvas refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selfieInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          facingMode: "environment",
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setErrorMessage(
        "Camera unavailable. Allow camera access in your browser or upload an image.",
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const b64 = canvas.toDataURL("image/jpeg", 0.92);
      stopCamera();
      processDocumentPayload({
        image: b64,
        fileName: "live_camera_capture.jpg",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      processDocumentPayload({
        image: b64,
        fileName: file.name,
        mimeType: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const loadSampleSpecimen = async (
    specimen: (typeof CALIBRATION_SPECIMENS)[0],
  ) => {
    if (isProcessing) return;
    if (specimen.type === "AADHAAR_CARD") {
      setIsProcessing(true);
      setErrorMessage(null);
      try {
        const response = await fetch(aadhaarExample.src);
        if (!response.ok)
          throw new Error("The Aadhaar example image could not be loaded.");
        const blob = await response.blob();
        const image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () =>
            reject(new Error("The Aadhaar example image could not be read."));
          reader.readAsDataURL(blob);
        });
        await processDocumentPayload({
          image,
          fileName: "aadhaar-demo-example.png",
          mimeType: "image/png",
          documentType: specimen.type,
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load the Aadhaar example.",
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }
    // Generate a clean rendered document canvas image
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Document background
      ctx.fillStyle =
        specimen.type === "PAN_CARD"
          ? "#0f2b48"
          : specimen.type === "AADHAAR_CARD"
            ? "#fbfbfa"
            : "#1a2538";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Border & Header
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 4;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Text lines
      ctx.fillStyle = specimen.type === "AADHAAR_CARD" ? "#1e293b" : "#f8fafc";
      ctx.font = "bold 28px monospace";
      const lines = specimen.text.split("\n");
      lines.forEach((l, i) => {
        ctx.fillText(l, 40, 80 + i * 45);
      });

      const b64 = canvas.toDataURL("image/jpeg", 0.95);
      processDocumentPayload({
        image: b64,
        fileName: `${specimen.name.replace(/\s+/g, "_")}.jpg`,
        documentType: specimen.type,
      });
    }
  };

  const processDocumentPayload = async (payload: {
    image: string;
    fileName: string;
    mimeType?: string;
    documentType?: string;
  }) => {
    setIsProcessing(true);
    setImagePreview(payload.image);
    setScreeningResult(null);
    setRevealedPii(false);
    setActiveTab("fields");
    setFaceVerifyResult(null);
    setSelfieImage(null);
    setParakhDispatchStatus(null);

    setErrorMessage(null);

    try {
      const res = await fetch("/api/screenings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Processing failed.");
      }

      const json = await res.json();
      setScreeningResult({
        ...json.data,
        classificationConfidence: json.classificationConfidence,
      });
    } catch (error: any) {
      setErrorMessage(error.message || "Failed to analyze document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRevealSensitivePii = async () => {
    if (!screeningResult) return;
    try {
      const res = await fetch(`/api/screenings/${screeningResult.id}/reveal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: revealJustification || "Visual inspection",
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setRevealedPii(true);
        setShowRevealModal(false);
        // update local extracted fields
        setScreeningResult({
          ...screeningResult,
          extractedFields: screeningResult.extractedFields.map((f: any) => {
            const match = json.revealedFields.find((rf: any) => rf.id === f.id);
            return match ? { ...f, maskedValue: match.value } : f;
          }),
        });
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Unable to reveal protected fields.");
      }
    } catch (e) {
      setErrorMessage("Unable to reveal protected fields. Please try again.");
    }
  };

  const handleOverrideType = async (newType: string) => {
    if (!screeningResult) return;
    try {
      const res = await fetch(
        `/api/screenings/${screeningResult.id}/override-type`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ documentType: newType }),
        },
      );
      if (res.ok) {
        const json = await res.json();
        setScreeningResult({
          ...screeningResult,
          ...json.data,
        });
        setShowOverrideModal(false);
      } else {
        const json = await res.json();
        setErrorMessage(json.error || "Unable to change document type.");
      }
    } catch (e) {
      setErrorMessage("Unable to change document type. Please try again.");
    }
  };

  const handleFaceVerifyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !screeningResult) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const b64 = reader.result as string;
      setSelfieImage(b64);
      setFaceVerifyLoading(true);

      try {
        const res = await fetch(
          `/api/screenings/${screeningResult.id}/face-verify`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ selfieImage: b64 }),
          },
        );
        const json = await res.json();
        if (json.success) {
          setFaceVerifyResult(json.comparison);
          setScreeningResult({
            ...screeningResult,
            riskScore: json.newRiskScore,
            riskTier: json.newRiskTier,
          });
        } else {
          setErrorMessage(json.error || "Face comparison is unavailable.");
        }
      } catch (err) {
        setErrorMessage("Unable to run face comparison. Please try again.");
      } finally {
        setFaceVerifyLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDispatchToParakh = async () => {
    if (!screeningResult) return;
    setParakhDispatchStatus("TRANSMITTING");
    try {
      const res = await fetch(
        `/api/screenings/${screeningResult.id}/parakh-dispatch`,
        {
          method: "POST",
        },
      );
      const json = await res.json();
      if (json.success) {
        setParakhDispatchStatus(
          `${json.receipt.status}: ${json.receipt.parakhTransactionId}`,
        );
      } else {
        setParakhDispatchStatus("FAILED");
      }
    } catch {
      setParakhDispatchStatus("FAILED");
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                Document screening
              </h1>
              <span className="text-[11px] uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-clay-700 border border-blue-200">
                Operator Station
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              Capture an identity document, inspect extracted fields, and review
              advisory risk signals.
            </p>
          </div>

          {screeningResult && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleDispatchToParakh}
                disabled={parakhDispatchStatus === "TRANSMITTING"}
                className="px-3 py-1.5 rounded-lg bg-clay-600 hover:bg-clay-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>
                  {parakhDispatchStatus === "TRANSMITTING"
                    ? "Cryptographically Transmitting..."
                    : parakhDispatchStatus?.startsWith("DELIVERED")
                      ? "Delivered to PARAKH"
                      : parakhDispatchStatus?.startsWith("QUEUED")
                        ? "Queued for delivery"
                        : "Send to PARAKH Hub"}
                </span>
              </button>

              <Link
                href={`/reports/${screeningResult.screeningId}`}
                className="px-3 py-1.5 rounded-lg bg-surface-100 hover:bg-surface-50 border border-border text-xs font-semibold text-ink-soft transition-colors flex items-center gap-1.5"
              >
                <FileText className="h-3.5 w-3.5 text-ink-soft" />
                <span>Full Dossier</span>
              </Link>
            </div>
          )}
        </div>

        {/* Operational Capture Options / Sample Specimens Bar */}
        <div className="p-4 rounded-xl bg-white border border-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs font-semibold text-ink transition-colors flex items-center gap-2"
            >
              <Upload className="h-3.5 w-3.5 text-clay-700" />
              <span>Browse document</span>
            </button>
            <input
              type="file"
              aria-label="Upload identity document"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
            />

            {!isCameraActive ? (
              <button
                disabled={isProcessing}
                onClick={startCamera}
                className="px-3 py-1.5 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs font-semibold text-ink transition-colors flex items-center gap-2"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-700" />
                <span>Open Device Camera</span>
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 transition-colors"
              >
                Close Camera
              </button>
            )}
          </div>

          {/* Quick Institutional Calibration Specimens */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            <span className="text-[11px] uppercase font-mono text-ink-faint mr-1">
              Demo samples:
            </span>
            {CALIBRATION_SPECIMENS.map((doc, idx) => (
              <button
                key={idx}
                disabled={isProcessing}
                onClick={() => loadSampleSpecimen(doc)}
                className="px-2.5 py-1 rounded bg-surface-200 hover:bg-surface-50 border border-border/80 text-[11px] font-mono text-ink-soft transition-colors whitespace-nowrap"
              >
                {doc.type.replace("_CARD", "")}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-ink-soft">
          OCR supports JPG, PNG, and WebP images. PDF text extraction is
          unavailable. Demo images are illustrative; a format/checksum warning
          is not proof of fraud or government verification.
        </p>

        {/* Live Camera Viewfinder Overlay (When Active) */}
        {isCameraActive && (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-blue-500/80 shadow-2xl max-w-2xl mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-auto max-h-[480px] object-cover"
            />

            {/* Document Alignment Frame Guides */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6 sm:p-12">
              <div className="w-full h-full max-w-lg aspect-[1.58] border-2 border-dashed border-emerald-400/90 rounded-xl relative flex flex-col justify-between p-3">
                {/* Crosshairs & Corner Guides */}
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400"></span>
                </div>
                <div className="text-center text-[11px] font-mono bg-black/60 text-emerald-700 py-1 px-3 rounded-full mx-auto backdrop-blur-sm">
                  Align ID card within frame &bull; Ensure clear lighting
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400"></span>
                </div>
              </div>
            </div>

            {/* Shutter Button Bar */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 z-20">
              <button
                onClick={captureCameraFrame}
                className="px-6 py-2.5 rounded-full bg-clay-600 hover:bg-clay-700 text-white font-bold text-xs shadow-lg shadow-soft transition-all flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                <span>Capture Document</span>
              </button>
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-full bg-slate-900/80 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            {errorMessage}
          </div>
        )}
        {parakhDispatchStatus && (
          <p role="status" className="text-sm text-ink-soft">
            Handoff: {parakhDispatchStatus}
          </p>
        )}
        {!screeningResult && !isProcessing && (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-16 text-center">
            <Scan className="mx-auto mb-4 h-9 w-9 text-clay-600" />
            <h2 className="font-display text-2xl text-ink">
              Start with a clear document
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft">
              Upload a file or use your camera. Synthetic samples let you
              explore the workflow without a real identity document.
            </p>
          </div>
        )}
        {/* Processing status */}
        {isProcessing && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-3 rounded-xl border border-border bg-white p-5 text-sm text-ink-soft"
          >
            <RefreshCw className="h-5 w-5 animate-spin text-clay-600" />
            <div>
              <p className="font-semibold text-ink">Analyzing your document</p>
              <p className="mt-1">
                Waiting for OCR and assessment results. This may take a moment.
              </p>
            </div>
          </div>
        )}

        {/* Main Screening Analysis Workbench */}
        {screeningResult && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column (5 Cols): Interactive Document Canvas Preview */}
            <div className="lg:col-span-5 space-y-4 order-2 lg:order-1">
              <div className="p-4 rounded-xl bg-white border border-border space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-ink">
                      Document Preview
                    </span>
                    <span className="text-[11px] font-mono text-ink-soft">
                      SHA256:{" "}
                      {screeningResult.document?.sha256Hash?.slice(0, 10)}...
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setShowOverrideModal(true);
                    }}
                    className="text-[11px] text-clay-700 hover:text-clay-700 font-medium cursor-pointer"
                  >
                    Change Type
                  </button>
                </div>

                {/* Document Display Canvas */}
                <div
                  className="relative rounded-lg overflow-hidden bg-surface-200 border border-border flex items-center justify-center p-2 group"
                  style={{
                    aspectRatio:
                      screeningResult.document?.width &&
                      screeningResult.document?.height
                        ? `${screeningResult.document.width} / ${screeningResult.document.height}`
                        : "1.58",
                  }}
                >
                  {imagePreview?.startsWith("data:application/pdf") ? (
                    <p className="text-sm text-ink-soft">
                      PDF preview unavailable. Review the extracted results.
                    </p>
                  ) : imagePreview ? (
                    <Image
                      unoptimized
                      width={1000}
                      height={630}
                      src={imagePreview}
                      alt="Scanned Document"
                      className="h-full w-full object-contain rounded"
                    />
                  ) : (
                    <div className="text-xs text-ink-faint font-mono">
                      No Image Stored
                    </div>
                  )}
                </div>

                {/* Document Metadata Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-ink-faint text-[11px]">
                      Document type
                    </span>
                    <span className="font-bold text-ink">
                      {screeningResult.documentType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-ink-faint text-[11px]">
                      OCR confidence
                    </span>
                    <span className="font-bold text-emerald-700 font-mono">
                      {screeningResult.ocrConfidenceAvailable
                        ? `${screeningResult.ocrResult?.averageConfidence}%`
                        : "Unavailable"}
                    </span>
                  </div>
                  <div className="p-2 rounded bg-surface-200">
                    <span className="block text-ink-faint text-[11px]">
                      Execution Time
                    </span>
                    <span className="font-bold text-ink-soft font-mono">
                      {screeningResult.processingTimeMs}ms
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (7 Cols): Tabbed Inspection Panels */}
            <div className="lg:col-span-7 space-y-4 order-1 lg:order-2">
              {/* Explainable Screening Assessment Card */}
              <section
                aria-labelledby="screening-risk-heading"
                className="p-5 sm:p-6 rounded-xl bg-white border border-border border-t-4 border-t-clay-600 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
                  <h2
                    id="screening-risk-heading"
                    className="text-xl sm:text-2xl font-bold tracking-tight text-ink"
                  >
                    Risk Assessment
                  </h2>
                  <span
                    className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold ${
                      screeningResult.riskTier === "LOW_RISK"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : screeningResult.riskTier === "REVIEW_REQUIRED"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {screeningResult.riskTier.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Score Gauge */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`h-24 w-24 shrink-0 rounded-full border-4 flex flex-col items-center justify-center font-mono ${
                        screeningResult.riskScore <= 25
                          ? "border-emerald-500 text-emerald-700"
                          : screeningResult.riskScore <= 65
                            ? "border-amber-500 text-amber-700"
                            : "border-rose-500 text-rose-700"
                      }`}
                    >
                      <span className="text-3xl font-bold leading-none">
                        {screeningResult.riskScore}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-ink-soft mt-1">
                        / 100 Risk
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-ink-soft leading-relaxed">
                    {screeningResult.riskAssessment?.compositeScore <= 25
                      ? "Low advisory risk based on the available screening signals. This does not certify document authenticity."
                      : "Operational review indicators identified. Manual supervisor review advised prior to decision."}
                  </div>
                </div>

                {/* Signal Factor Lists */}
                {screeningResult.riskAssessment && (
                  <div className="space-y-3 pt-4 border-t border-border text-sm">
                    {JSON.parse(
                      screeningResult.riskAssessment.positiveSignalsJson ||
                        "[]",
                    ).map((sig: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-ink-soft"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm leading-relaxed">
                          {sig}
                        </span>
                      </div>
                    ))}
                    {JSON.parse(
                      screeningResult.riskAssessment.reviewIndicatorsJson ||
                        "[]",
                    ).map((sig: string, i: number) => (
                      <div
                        key={i}
                        className="flex items-start gap-1.5 text-amber-700"
                      >
                        <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm leading-relaxed">
                          {sig}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Tab Navigation */}
              <div
                role="tablist"
                aria-label="Screening inspection"
                onKeyDown={(event) => {
                  if (
                    !["ArrowLeft", "ArrowRight", "Home", "End"].includes(
                      event.key,
                    )
                  )
                    return;
                  event.preventDefault();
                  const tabs = Array.from(
                    event.currentTarget.querySelectorAll<HTMLButtonElement>(
                      '[role="tab"]',
                    ),
                  );
                  const index = tabs.indexOf(
                    document.activeElement as HTMLButtonElement,
                  );
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? tabs.length - 1
                        : (index +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            tabs.length) %
                          tabs.length;
                  tabs[next]?.focus();
                  tabs[next]?.click();
                }}
                className="flex items-center gap-1 p-1 rounded-xl bg-white border border-border overflow-x-auto"
              >
                <button
                  role="tab"
                  id="inspection-tab-fields"
                  aria-selected={activeTab === "fields"}
                  aria-controls="inspection-panel-fields"
                  tabIndex={activeTab === "fields" ? 0 : -1}
                  onClick={() => setActiveTab("fields")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "fields"
                      ? "bg-clay-600 text-white font-semibold shadow"
                      : "text-ink-soft hover:text-ink hover:bg-sand-100"
                  }`}
                >
                  Extracted Information
                </button>
                <button
                  role="tab"
                  id="inspection-tab-forensics"
                  aria-selected={activeTab === "forensics"}
                  aria-controls="inspection-panel-forensics"
                  tabIndex={activeTab === "forensics" ? 0 : -1}
                  onClick={() => setActiveTab("forensics")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "forensics"
                      ? "bg-clay-600 text-white font-semibold shadow"
                      : "text-ink-soft hover:text-ink hover:bg-sand-100"
                  }`}
                >
                  Document Forensics
                </button>
                <button
                  role="tab"
                  id="inspection-tab-face"
                  aria-selected={activeTab === "face"}
                  aria-controls="inspection-panel-face"
                  tabIndex={activeTab === "face" ? 0 : -1}
                  onClick={() => setActiveTab("face")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "face"
                      ? "bg-clay-600 text-white font-semibold shadow"
                      : "text-ink-soft hover:text-ink hover:bg-sand-100"
                  }`}
                >
                  Identity Face Check
                </button>
                {screeningResult.documentType === "PASSPORT" && (
                  <button
                    role="tab"
                    id="inspection-tab-mrz"
                    aria-selected={activeTab === "mrz"}
                    aria-controls="inspection-panel-mrz"
                    tabIndex={activeTab === "mrz" ? 0 : -1}
                    onClick={() => setActiveTab("mrz")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      activeTab === "mrz"
                        ? "bg-clay-600 text-white font-semibold shadow"
                        : "text-ink-soft hover:text-ink hover:bg-sand-100"
                    }`}
                  >
                    MRZ Analysis
                  </button>
                )}
                <button
                  role="tab"
                  id="inspection-tab-raw"
                  aria-selected={activeTab === "raw"}
                  aria-controls="inspection-panel-raw"
                  tabIndex={activeTab === "raw" ? 0 : -1}
                  onClick={() => setActiveTab("raw")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    activeTab === "raw"
                      ? "bg-clay-600 text-white font-semibold shadow"
                      : "text-ink-soft hover:text-ink hover:bg-sand-100"
                  }`}
                >
                  Raw OCR Text
                </button>
              </div>

              {/* Tab 1: Extracted Information Panel */}
              {activeTab === "fields" && (
                <div
                  role="tabpanel"
                  id="inspection-panel-fields"
                  aria-labelledby="inspection-tab-fields"
                  tabIndex={0}
                  className="p-5 rounded-xl bg-white border border-border space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        Structured Demographic Fields
                      </h3>
                      <p className="text-[11px] text-ink-faint">
                        Sensitive government identifiers are masked by default.
                      </p>
                    </div>

                    {!revealedPii ? (
                      <button
                        onClick={() => {
                          setErrorMessage(null);
                          setShowRevealModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-surface-200 hover:bg-surface-50 border border-border text-[11px] text-ink-soft font-medium transition-colors flex items-center gap-1.5"
                      >
                        <Eye className="h-3 w-3 text-clay-700" />
                        <span>Reveal Protected PII</span>
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Audit: PII Unmasked
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-ink-soft">
                    OCR percentages describe recognition of source words. VALID
                    means the implemented text checks passed; it does not verify
                    identity or issuance.
                  </p>
                  {screeningResult.documentType === "AADHAAR_CARD" &&
                    !screeningResult.extractedFields?.some(
                      (field: any) => field.fieldKey === "holder_name",
                    ) && (
                      <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                        Full name was not confidently located in OCR text.
                        Review the original document; a neighboring address is
                        never used as the name.
                      </p>
                    )}
                  <div className="divide-y divide-border/60">
                    {screeningResult.extractedFields?.map((field: any) => (
                      <div
                        key={field.id}
                        className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0 break-words">
                          <span className="text-[11px] text-ink-soft font-medium block">
                            {field.fieldLabel}
                          </span>
                          <span
                            className={`font-mono text-sm ${
                              field.isSensitive
                                ? "text-clay-700 font-semibold tracking-wider"
                                : "text-ink font-medium"
                            }`}
                          >
                            {field.maskedValue}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono text-ink-soft">
                            {field.confidenceSource === "OCR_WORDS"
                              ? `${field.confidence}% OCR`
                              : "OCR confidence unavailable"}
                          </span>
                          <span
                            className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-bold ${
                              field.validationStatus === "VALID"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {field.validationStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Document Forensics */}
              {activeTab === "forensics" && (
                <div
                  role="tabpanel"
                  id="inspection-panel-forensics"
                  aria-labelledby="inspection-tab-forensics"
                  tabIndex={0}
                  className="p-5 rounded-xl bg-white border border-border space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        OCR Evidence & Text Checks
                      </h3>
                      <p className="text-[11px] text-ink-faint">
                        Confidence measures text recognition, not identity
                        matches. Pixel-level tampering, fonts, sharpness and
                        glare are not measured.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="block text-ink-faint">OCR engine</span>
                      <span className="font-mono">
                        {screeningResult.ocrResult?.provider || "Unavailable"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="block text-ink-faint">
                        Recognized words
                      </span>
                      <span className="font-mono">
                        {screeningResult.ocrResult?.wordsCount ?? "Unavailable"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="block text-ink-faint">
                        Type heuristic score
                      </span>
                      <span className="font-mono">
                        {screeningResult.classificationConfidence ?? "—"}/100
                      </span>
                      <p className="text-ink-faint mt-1">
                        Keyword rules, not a calibrated probability.
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-surface-200">
                      <span className="block text-ink-faint">
                        Pixel forensics
                      </span>
                      <span>Not available · manual inspection required</span>
                    </div>
                  </div>

                  {/* Forensic Findings */}
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-ink-soft">
                      Text Validation Findings
                    </p>
                    {screeningResult.forensicAnomalies?.length === 0 ? (
                      <div className="p-3 rounded-lg bg-surface-200 text-xs text-ink-soft flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span>
                          No text format/checksum warnings. Image authenticity
                          has not been assessed.
                        </span>
                      </div>
                    ) : (
                      screeningResult.forensicAnomalies?.map((anom: any) => (
                        <div
                          key={anom.id}
                          className="p-3 rounded-lg bg-surface-200 border border-border/80 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-ink">
                              {anom.title}
                            </span>
                            <span className="text-[11px] px-1.5 py-0.2 rounded font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              {anom.severity}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-soft leading-snug">
                            {anom.explanation}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Biometric Face Verification */}
              {activeTab === "face" && (
                <div
                  role="tabpanel"
                  id="inspection-panel-face"
                  aria-labelledby="inspection-tab-face"
                  tabIndex={0}
                  className="p-5 rounded-xl bg-white border border-border space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                        Face comparison
                      </h3>
                      <p className="text-[11px] text-ink-faint">
                        Upload a selfie for an auxiliary comparison.
                        Availability depends on the configured provider.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Document Face Reference */}
                    <div className="p-3 rounded-lg bg-surface-200 border border-border text-center space-y-2">
                      <span className="text-[11px] uppercase font-mono text-ink-soft">
                        Document Portrait Zone
                      </span>
                      <div className="h-32 w-28 mx-auto rounded-lg bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                        {imagePreview ? (
                          <Image
                            unoptimized
                            width={112}
                            height={128}
                            src={imagePreview}
                            alt="Crop"
                            className="h-full w-full object-cover scale-150"
                          />
                        ) : (
                          <span className="text-xs text-ink-faint">
                            Portrait
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-ink-faint block">
                        Document image preview; portrait crop unavailable
                      </span>
                    </div>

                    {/* Live Selfie Input */}
                    <div className="p-3 rounded-lg bg-surface-200 border border-border text-center space-y-2">
                      <span className="text-[11px] uppercase font-mono text-ink-soft">
                        Live Verification Selfie
                      </span>
                      <div className="h-32 w-28 mx-auto rounded-lg bg-black/40 border border-border flex items-center justify-center overflow-hidden">
                        {selfieImage ? (
                          <Image
                            unoptimized
                            width={112}
                            height={128}
                            src={selfieImage}
                            alt="Selfie"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <button
                            onClick={() => selfieInputRef.current?.click()}
                            className="text-xs text-clay-700 hover:underline p-2 font-medium"
                          >
                            Upload Selfie
                          </button>
                        )}
                      </div>
                      <input
                        type="file"
                        aria-label="Upload verification selfie"
                        ref={selfieInputRef}
                        onChange={handleFaceVerifyUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => selfieInputRef.current?.click()}
                        className="text-[11px] text-ink-soft hover:text-ink underline block mx-auto"
                      >
                        {selfieImage ? "Replace Selfie" : "Select Image"}
                      </button>
                    </div>
                  </div>

                  {faceVerifyLoading && (
                    <div className="p-3 rounded bg-blue-50 text-xs text-clay-700 flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Waiting for the face comparison result…</span>
                    </div>
                  )}

                  {faceVerifyResult && (
                    <div className="p-4 rounded-lg bg-surface-200 border border-border space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink">
                          Biometric Similarity Result
                        </span>
                        <span
                          className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                            faceVerifyResult.matchStatus === "MATCH"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {faceVerifyResult.matchStatus}:{" "}
                          {faceVerifyResult.similarityScore}%
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-soft leading-snug">
                        Notice: Face similarity metric is an auxiliary
                        operational signal and does not constitute a statutory
                        biometric verification.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "mrz" && (
                <section
                  role="tabpanel"
                  id="inspection-panel-mrz"
                  aria-labelledby="inspection-tab-mrz"
                  tabIndex={0}
                  className="rounded-xl border border-border bg-white p-5 space-y-3"
                >
                  <h3 className="text-sm font-semibold text-ink">
                    Passport MRZ assessment
                  </h3>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    A detailed MRZ checksum matrix is unavailable in this
                    response. Inspect the extracted passport fields and their
                    validation status; no overall checksum result is inferred
                    here.
                  </p>
                  <div className="rounded-lg bg-surface-200 p-4 text-xs text-ink-soft">
                    Use the Fields tab for extracted values and Raw OCR for the
                    recognized text.
                  </div>
                </section>
              )}

              {/* Tab 5: Raw OCR Text */}
              {activeTab === "raw" && (
                <div
                  role="tabpanel"
                  id="inspection-panel-raw"
                  aria-labelledby="inspection-tab-raw"
                  tabIndex={0}
                  className="p-5 rounded-xl bg-white border border-border space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink-soft">
                        Raw OCR Character Stream
                      </span>
                      <span className="text-[11px] font-mono text-ink-faint">
                        {screeningResult.ocrResult?.provider} &bull;{" "}
                        {screeningResult.ocrConfidenceAvailable
                          ? `${screeningResult.ocrResult?.averageConfidence}% OCR`
                          : "Confidence unavailable"}{" "}
                        · {screeningResult.ocrResult?.wordsCount ?? 0} words
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          screeningResult.ocrResult?.fullText || "",
                        );
                        alert("Raw OCR text copied to clipboard.");
                      }}
                      className="px-2 py-1 rounded bg-surface-200 hover:bg-surface-50 text-[11px] text-ink-soft font-medium flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>

                  <pre className="p-3 rounded-lg bg-surface-200 font-mono text-xs text-ink-soft whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {screeningResult.ocrResult?.fullText || "No OCR output."}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal: Authorized PII Unmasking */}
        <Dialog
          open={showRevealModal}
          onOpenChange={setShowRevealModal}
          title="Authorized PII unmasking"
          className="max-w-md"
        >
          {errorMessage && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          )}
          <p className="text-xs text-ink-soft leading-relaxed">
            Revealing full identity numbers requires authorization and a reason.
            An audit event is submitted with your operator ID and timestamp.
          </p>

          <div>
            <label
              htmlFor="reveal-reason"
              className="block text-xs font-semibold text-ink-soft mb-1"
            >
              Operational Justification (Mandatory)
            </label>
            <input
              type="text"
              id="reveal-reason"
              value={revealJustification}
              onChange={(e) => setRevealJustification(e.target.value)}
              placeholder="e.g., Guest check-in verification or KYC discrepancy"
              className="w-full px-3 py-2 rounded-lg bg-surface-200 border border-border text-xs text-ink placeholder-ink-faint focus:outline-none focus:border-clay-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={() => setShowRevealModal(false)}
              className="px-3 py-1.5 rounded-lg bg-surface-200 text-ink-soft text-xs font-medium hover:bg-surface-50"
            >
              Cancel
            </button>
            <button
              disabled={!revealJustification.trim()}
              onClick={handleRevealSensitivePii}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
            >
              Acknowledge & Unmask
            </button>
          </div>
        </Dialog>

        {/* Modal: Override Document Classification */}
        <Dialog
          open={showOverrideModal}
          onOpenChange={setShowOverrideModal}
          title="Change document type"
          className="max-w-sm"
        >
          {errorMessage && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-700"
            >
              {errorMessage}
            </p>
          )}
          <p className="text-xs text-ink-soft">
            Select the target document type. All structured fields will be
            re-parsed using the selected schema.
          </p>
          <div className="space-y-1.5">
            {(
              [
                "AADHAAR_CARD",
                "PAN_CARD",
                "PASSPORT",
                "DRIVING_LICENCE",
                "VOTER_ID",
              ] as const
            ).map((t) => (
              <button
                key={t}
                onClick={() => handleOverrideType(t)}
                className="w-full text-left px-3 py-2 rounded-lg bg-surface-200 hover:bg-surface-50 border border-border text-xs text-ink-soft font-medium transition-colors"
              >
                {t.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </Dialog>
      </div>
    </AppShell>
  );
}
