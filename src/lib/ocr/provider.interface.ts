export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRWord {
  text: string;
  confidence: number | null;
  bbox?: OCRBoundingBox;
}

export interface OCRResponse {
  provider: string;
  fullText: string;
  averageConfidence: number;
  wordsCount: number;
  linesCount: number;
  executionTimeMs: number;
  words?: OCRWord[];
  status?: "SUCCEEDED" | "NO_TEXT" | "FAILED";
  confidenceAvailable?: boolean;
  imageDimensions?: { width: number; height: number };
}

export interface IOCRProvider {
  name: string;
  isAvailable(): boolean;
  processImage(imageBuffer: Buffer | string): Promise<OCRResponse>;
}
