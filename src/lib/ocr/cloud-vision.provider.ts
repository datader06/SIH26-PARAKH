import { IOCRProvider, OCRResponse, OCRWord } from "./provider.interface";

import { averageWordConfidence, roundConfidence } from "./evidence";

// Exported separately so the real provider response can be tested without credentials/network.
export function parseCloudVisionAnnotation(
  annotation: any,
): Omit<OCRResponse, "provider" | "executionTimeMs"> {
  const words: OCRWord[] = [];
  for (const page of annotation?.pages || []) {
    for (const block of page.blocks || [])
      for (const paragraph of block.paragraphs || [])
        for (const word of paragraph.words || []) {
          const text = (word.symbols || [])
            .map((symbol: any) => symbol.text || "")
            .join("");
          const vertices = word.boundingBox?.vertices || [];
          const xs = vertices.map((point: any) => Number(point.x || 0));
          const ys = vertices.map((point: any) => Number(point.y || 0));
          words.push({
            text,
            confidence:
              typeof word.confidence === "number" &&
              Number.isFinite(word.confidence)
                ? roundConfidence(word.confidence * 100)
                : null,
            bbox:
              vertices.length >= 4
                ? {
                    x: Math.min(...xs),
                    y: Math.min(...ys),
                    width: Math.max(...xs) - Math.min(...xs),
                    height: Math.max(...ys) - Math.min(...ys),
                  }
                : undefined,
          });
        }
  }
  const average = averageWordConfidence(words);
  const page = annotation?.pages?.[0];
  const fullText = annotation?.text || "";
  return {
    fullText,
    words,
    averageConfidence: average ?? 0,
    confidenceAvailable: average !== null,
    status: fullText.trim() ? "SUCCEEDED" : "NO_TEXT",
    wordsCount: words.length,
    linesCount: fullText.split("\n").filter(Boolean).length,
    imageDimensions:
      page?.width > 0 && page?.height > 0
        ? { width: page.width, height: page.height }
        : undefined,
  };
}

export class CloudVisionProvider implements IOCRProvider {
  name = "GOOGLE_CLOUD_VISION";
  private apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  }

  isAvailable(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async processImage(imageSource: Buffer | string): Promise<OCRResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        "Google Cloud Vision API key is not configured in organization settings. Using primary fallback OCR engine.",
      );
    }

    const startTime = Date.now();
    let base64Content = "";

    if (Buffer.isBuffer(imageSource)) {
      base64Content = imageSource.toString("base64");
    } else if (typeof imageSource === "string") {
      base64Content = imageSource.includes(",")
        ? imageSource.split(",")[1]
        : imageSource;
    }

    try {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64Content },
                features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        throw new Error(
          `Cloud Vision responded with status ${response.status}`,
        );
      }

      const data = await response.json();
      const annotation = data.responses?.[0]?.fullTextAnnotation;
      if (data.responses?.[0]?.error)
        throw new Error("Cloud Vision could not process the image.");
      return {
        provider: this.name,
        ...parseCloudVisionAnnotation(annotation),
        executionTimeMs: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error("[CLOUD_VISION_ERROR]", error);
      return {
        provider: this.name,
        status: "FAILED",
        confidenceAvailable: false,
        fullText: "",
        averageConfidence: 0,
        wordsCount: 0,
        linesCount: 0,
        executionTimeMs: Date.now() - startTime,
        words: [],
      };
    }
  }
}
