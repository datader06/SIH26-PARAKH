import { createWorker } from "tesseract.js";
import { IOCRProvider, OCRResponse, OCRWord } from "./provider.interface";
import path from "path";
import fs from "fs";

function resolveWorkerPath(): string | undefined {
  // require.resolve() can fail to return a usable absolute path when this module
  // runs inside Next.js's bundled server runtime (its require() is shimmed for
  // route tracing), which previously caused worker_threads to reject the bare
  // specifier it fell back to. Resolve via process.cwd() first since that is
  // reliable in both the Next.js dev/prod server process and plain Node.
  const candidates = [
    path.join(process.cwd(), "node_modules", "tesseract.js", "src", "worker-script", "node", "index.js"),
  ];

  try {
    candidates.push(require.resolve("tesseract.js/src/worker-script/node/index.js"));
  } catch {
    // ignore; fall through to other candidates
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return undefined;
}

export class TesseractProvider implements IOCRProvider {
  name = "TESSERACT_LOCAL";

  isAvailable(): boolean {
    return true; // Local engine is always available
  }

  async processImage(imageSource: Buffer | string): Promise<OCRResponse> {
    const startTime = Date.now();
    let worker: any = null;

    try {
      const workerPath = resolveWorkerPath();

      worker = await createWorker("eng", 1, workerPath ? { workerPath } : undefined);

      const ret = await worker.recognize(imageSource);
      const executionTimeMs = Date.now() - startTime;

      const words: OCRWord[] = (ret.data.words || []).map((w: any) => ({
        text: w.text,
        confidence: Math.round(w.confidence || 0),
        bbox: w.bbox
          ? {
              x: w.bbox.x0,
              y: w.bbox.y0,
              width: w.bbox.x1 - w.bbox.x0,
              height: w.bbox.y1 - w.bbox.y0,
            }
          : undefined,
      }));

      const averageConfidence =
        words.length > 0
          ? Math.round(words.reduce((sum, w) => sum + w.confidence, 0) / words.length)
          : Math.round(ret.data.confidence || 0);

      const linesCount = ret.data.lines
        ? ret.data.lines.length
        : ret.data.text.split("\n").filter(Boolean).length;

      return {
        provider: this.name,
        fullText: ret.data.text || "",
        averageConfidence: Math.min(100, Math.max(0, averageConfidence)),
        wordsCount: words.length,
        linesCount: linesCount,
        executionTimeMs,
        words,
      };
    } catch (error: any) {
      console.error("[TESSERACT_ENGINE_FAILURE]", error?.message || error);
      // The OCR engine genuinely could not process this image. Report an honest
      // failure (zero confidence, no text) rather than fabricating plausible-looking
      // document content — a fake success here would let any input, including
      // non-document images, sail through classification and risk scoring as valid.
      return {
        provider: "OCR_ENGINE_UNAVAILABLE",
        fullText: "",
        averageConfidence: 0,
        wordsCount: 0,
        linesCount: 0,
        executionTimeMs: Date.now() - startTime,
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // ignore termination error
        }
      }
    }
  }
}
