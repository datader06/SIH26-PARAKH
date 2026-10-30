export interface ParsedField {
  key: string;
  label: string;
  rawValue: string;
  maskedValue: string;
  isSensitive: boolean;
  confidence: number;
  sourceText?: string;
  confidenceSource?: "OCR_WORDS" | "UNAVAILABLE";
  validationStatus: "VALID" | "WARNING" | "INCONSISTENT";
}

// Verhoeff Algorithm for Aadhaar Checksum Validation
const d: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
];

const p: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8],
];

export function validateVerhoeff(numStr: string): boolean {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length !== 12) return false;

  let c = 0;
  const reversed = clean.split("").reverse();
  for (let i = 0; i < reversed.length; i++) {
    const digit = parseInt(reversed[i], 10);
    c = d[c][p[i % 8][digit]];
  }
  return c === 0;
}

export function maskAadhaar(numStr: string): string {
  const clean = numStr.replace(/\D/g, "");
  if (clean.length === 12) {
    const last4 = clean.slice(-4);
    return `XXXX XXXX ${last4}`;
  }
  return "XXXX XXXX ****";
}

// A name must look like a person name, not a neighboring label or address.
export function isNameCandidate(value: string): boolean {
  return (
    value.length >= 2 &&
    value.length <= 80 &&
    new RegExp("^[\\p{L}\\p{M} .'-]+$", "u").test(value) &&
    !/GOVERNMENT|GOVT|UNIQUE|INDIA|AUTHORITY|ENROLMENT|AADHAAR|AADHAR|UIDAI|IDENTIFICATION|ADDRESS|DOB|BIRTH|MALE|FEMALE|TRANSGENDER|PEHCHAN|MERA|FLAT|APARTMENT|ROAD|STREET|DISTRICT|PINCODE|नाम|पता|जन्म|भारत|पहचान/i.test(
      value,
    )
  );
}

export function extractAadhaarFields(text: string): ParsedField[] {
  const fields: ParsedField[] = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const uid = text.match(/\b(\d{4}[\s\-.|]{0,2}\d{4}[\s\-.|]{0,2}\d{4})\b/);
  if (uid) {
    const digits = uid[1].replace(/\D/g, "");
    fields.push({
      key: "aadhaar_number",
      label: "Aadhaar Number",
      rawValue: `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`,
      maskedValue: maskAadhaar(digits),
      isSensitive: true,
      confidence: 0,
      sourceText: uid[1],
      validationStatus:
        /^[2-9]/.test(digits) && validateVerhoeff(digits) ? "VALID" : "WARNING",
    });
  }
  const dob = text.match(
    /(?:DOB|Date\s+of\s+Birth|जन्म\s*तिथि)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
  );
  const yob = text.match(/(?:Year\s+of\s+Birth|YOB)\s*[:\-]?\s*(\d{4})/i);
  if (dob) {
    const [day, month, year] = dob[1].split(/[\/\-]/).map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid =
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day;
    fields.push({
      key: "dob",
      label: "Date of Birth",
      rawValue: dob[1],
      maskedValue: dob[1],
      sourceText: dob[1],
      isSensitive: false,
      confidence: 0,
      validationStatus: valid ? "VALID" : "WARNING",
    });
  } else if (yob)
    fields.push({
      key: "yob",
      label: "Year of Birth",
      rawValue: yob[1],
      maskedValue: yob[1],
      sourceText: yob[1],
      isSensitive: false,
      confidence: 0,
      validationStatus: "VALID",
    });
  const gender = text.match(
    /(?:^|[\s:])(FEMALE|MALE|TRANSGENDER|पुरुष|महिला)(?=$|[\s.,])/i,
  );
  if (gender) {
    const value = gender[1].toUpperCase();
    const normalized =
      value === "महिला" ? "FEMALE" : value === "पुरुष" ? "MALE" : value;
    fields.push({
      key: "gender",
      label: "Gender",
      rawValue: normalized,
      maskedValue: normalized,
      sourceText: gender[1],
      isSensitive: false,
      confidence: 0,
      validationStatus: "VALID",
    });
  }
  const addressStart = lines.findIndex((line) =>
    /^(?:Address|पता)\s*[:\-]/i.test(line),
  );
  let addressEnd = addressStart;
  if (addressStart >= 0) {
    const parts: string[] = [];
    for (
      let i = addressStart;
      i < Math.min(lines.length, addressStart + 8);
      i++
    ) {
      const line =
        i === addressStart
          ? lines[i].replace(/^(?:Address|पता)\s*[:\-]\s*/i, "")
          : lines[i];
      if (
        i > addressStart &&
        /^(?:DOB|Date\s+of\s+Birth|Year\s+of\s+Birth|YOB|MALE|FEMALE|TRANSGENDER|Mera|Name|जन्म|पुरुष|महिला)\b|\b\d{4}[\s\-.|]{0,2}\d{4}[\s\-.|]{0,2}\d{4}\b/i.test(
          line,
        )
      )
        break;
      if (line) parts.push(line);
      addressEnd = i;
    }
    const address = parts.join(", ");
    if (address.length > 5)
      fields.push({
        key: "address",
        label: "Address",
        rawValue: address,
        maskedValue: address.slice(0, 25) + "… [Protected Address]",
        sourceText: parts.join(" "),
        isSensitive: true,
        confidence: 0,
        validationStatus: "VALID",
      });
  }
  let name = "";
  const labeled = lines.findIndex((line) =>
    /^(?:Name|Full\s+Name|नाम)\s*[:\-]?\s*/i.test(line),
  );
  if (labeled >= 0) {
    const inline = lines[labeled]
      .replace(/^(?:Full\s+Name|Name|नाम)\s*[:\-]?\s*/i, "")
      .trim();
    const candidate = inline || lines[labeled + 1] || "";
    if (isNameCandidate(candidate)) name = candidate;
  }
  if (!name) {
    const birthLine = lines.findIndex((line) =>
      /DOB|Date\s+of\s+Birth|Year\s+of\s+Birth|YOB|जन्म/i.test(line),
    );
    const previous = birthLine - 1;
    if (
      previous >= 0 &&
      !(
        addressStart >= 0 &&
        previous >= addressStart &&
        previous <= addressEnd
      ) &&
      isNameCandidate(lines[previous])
    )
      name = lines[previous];
  }
  if (name)
    fields.push({
      key: "holder_name",
      label: "Full Name",
      rawValue: name,
      maskedValue: name,
      sourceText: name,
      isSensitive: false,
      confidence: 0,
      validationStatus: "VALID",
    });
  return fields;
}
