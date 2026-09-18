import { strFromU8, unzipSync } from "fflate";

export const TRACKING_SHEET_ACCEPT =
  ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const TRACKING_SHEET_MAX_BYTES = 5 * 1024 * 1024;

export type TrackingSheetValues = {
  name: string;
  referenceNumber: string;
  cvUrl: string;
  primaryResidence: string;
  passports: string;
  preferredLocations: string;
  noticePeriod: string;
  maximumDuration: string;
  mostRecentPosition: string;
  previousAssignments: string;
  yearsAsGm: string;
  specialty: string;
  numberOfKeys: string;
  openingExperience: string;
  capexRefurbExperience: string;
  languages: string;
  linkedinUrl: string;
  email: string;
  phone: string;
  personalStatus: string;
  blackoutDates: string;
  enrolmentDate: string;
  notes: string;
};

type SheetField = keyof TrackingSheetValues;

const EMPTY_VALUES: TrackingSheetValues = {
  name: "",
  referenceNumber: "",
  cvUrl: "",
  primaryResidence: "",
  passports: "",
  preferredLocations: "",
  noticePeriod: "",
  maximumDuration: "",
  mostRecentPosition: "",
  previousAssignments: "",
  yearsAsGm: "",
  specialty: "",
  numberOfKeys: "",
  openingExperience: "",
  capexRefurbExperience: "",
  languages: "",
  linkedinUrl: "",
  email: "",
  phone: "",
  personalStatus: "",
  blackoutDates: "",
  enrolmentDate: "",
  notes: "",
};

const COMMA_LIST_FIELDS = new Set<SheetField>(["passports", "languages"]);
const DATE_FIELDS = new Set<SheetField>(["enrolmentDate"]);

type Cell = {
  text: string;
  hyperlink: string | null;
};

export function validateTrackingSheetFile(file: File): string | null {
  if (file.size > TRACKING_SHEET_MAX_BYTES) {
    return "Excel files must be 5 MB or smaller.";
  }

  const name = file.name.toLowerCase();
  const type = file.type;
  const extOk = name.endsWith(".xlsx");
  const typeOk =
    !type ||
    type ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    type === "application/octet-stream" ||
    type === "application/zip";

  if (!extOk || !typeOk) {
    return "Upload an .xlsx tracking sheet.";
  }

  return null;
}

export function parseTrackingSheet(buffer: ArrayBuffer): {
  values: TrackingSheetValues | null;
  error: string | null;
} {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(new Uint8Array(buffer));
  } catch {
    return { values: null, error: "That file is not a valid Excel workbook." };
  }

  const xml = (path: string) => {
    const match = Object.entries(files).find(
      ([name]) => name.replace(/\\/g, "/") === path,
    );
    return match ? strFromU8(match[1]) : "";
  };

  const workbook = xml("xl/workbook.xml");
  const workbookRels = xml("xl/_rels/workbook.xml.rels");
  if (!workbook || !workbookRels) {
    return { values: null, error: "Could not read the Excel workbook." };
  }

  const sheetRid = firstMatch(
    workbook,
    /<sheet\b[^>]*\br:id="([^"]+)"/i,
  );
  if (!sheetRid) {
    return { values: null, error: "The Excel file has no worksheet." };
  }

  const sheetTarget = relationshipTarget(workbookRels, sheetRid);
  if (!sheetTarget) {
    return { values: null, error: "Could not find the first worksheet." };
  }

  const sheetPath = `xl/${sheetTarget.replace(/^\//, "").replace(/^xl\//, "")}`;
  const sheetDir = sheetPath.slice(0, sheetPath.lastIndexOf("/") + 1);
  const sheetName = sheetPath.slice(sheetPath.lastIndexOf("/") + 1);
  const sheetXml = xml(sheetPath);
  const relsXml = xml(`${sheetDir}_rels/${sheetName}.rels`);

  if (!sheetXml) {
    return { values: null, error: "Could not read the tracking sheet." };
  }

  const sharedStrings = parseSharedStrings(xml("xl/sharedStrings.xml"));
  const hyperlinks = parseHyperlinks(sheetXml, relsXml);
  const grid = parseSheetGrid(sheetXml, sharedStrings, hyperlinks);
  const header = findHeaderRow(grid);

  if (!header) {
    return {
      values: null,
      error: "Could not find tracking-sheet column headers (Name, email, …).",
    };
  }

  const values = readFirstPerson(grid, header);
  if (!values?.name) {
    return {
      values: null,
      error: "The sheet has headers, but no person row with a name.",
    };
  }

  return { values, error: null };
}

function readFirstPerson(
  grid: Map<number, Map<string, Cell>>,
  header: { row: number; columns: Map<string, SheetField> },
): TrackingSheetValues | null {
  const rows = [...grid.keys()].sort((left, right) => left - right);
  const dataRows = rows.filter((row) => row > header.row);
  const nameCol =
    [...header.columns.entries()].find(([, field]) => field === "name")?.[0] ??
    "B";

  const firstRow = dataRows.find((row) => cellText(grid, row, nameCol));
  if (!firstRow) {
    return null;
  }

  const values = { ...EMPTY_VALUES };

  for (const row of dataRows) {
    if (row < firstRow) continue;
    const name = cellText(grid, row, nameCol);
    if (row > firstRow && name) break;

    for (const [col, field] of header.columns) {
      const cell = grid.get(row)?.get(col);
      if (!cell) continue;
      const next = fieldValue(field, cell);
      if (!next) continue;
      values[field] = values[field] ? `${values[field]}\n${next}` : next;
    }
  }

  return values;
}

function fieldValue(field: SheetField, cell: Cell): string {
  const hyperlink = cleanHyperlink(field, cell.hyperlink);
  if (hyperlink) {
    return hyperlink;
  }

  let text = cell.text.trim();
  if (!text) {
    return "";
  }

  if (DATE_FIELDS.has(field) && isExcelSerial(text)) {
    text = excelSerialToDate(Number(text));
  }

  if (COMMA_LIST_FIELDS.has(field)) {
    return text
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .join("\n");
  }

  return text;
}

function cleanHyperlink(field: SheetField, href: string | null): string {
  if (!href) return "";
  const trimmed = href.trim();
  if (!trimmed) return "";

  if (field === "email") {
    return trimmed.replace(/^mailto:/i, "").split("?")[0];
  }

  return trimmed;
}

function findHeaderRow(
  grid: Map<number, Map<string, Cell>>,
): { row: number; columns: Map<string, SheetField> } | null {
  let best: { row: number; columns: Map<string, SheetField> } | null = null;

  for (const [row, cells] of grid) {
    const columns = new Map<string, SheetField>();
    for (const [col, cell] of cells) {
      const field = headerField(cell.text);
      if (field) {
        columns.set(col, field);
      }
    }
    if (!hasNameHeader(columns)) continue;
    if (!best || columns.size > best.columns.size) {
      best = { row, columns };
    }
  }

  return best;
}

function hasNameHeader(columns: Map<string, SheetField>): boolean {
  return [...columns.values()].includes("name");
}

function headerField(label: string): SheetField | null {
  const normalized = label
    .toLowerCase()
    .replace(/[.#]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  if (!normalized) return null;
  if (
    normalized === "name" ||
    normalized === "full name" ||
    normalized === "candidate name"
  ) {
    return "name";
  }
  if (normalized === "ref" || normalized.startsWith("ref ")) {
    return "referenceNumber";
  }
  if (normalized.includes("cv")) return "cvUrl";
  if (
    normalized.includes("primary residence") ||
    normalized === "residence"
  ) {
    return "primaryResidence";
  }
  if (normalized.startsWith("passport")) return "passports";
  if (normalized.includes("preferred location")) return "preferredLocations";
  if (normalized.includes("notice")) return "noticePeriod";
  if (
    normalized.includes("maximum duration") ||
    normalized.includes("max duration")
  ) {
    return "maximumDuration";
  }
  if (normalized.includes("most recent position")) return "mostRecentPosition";
  if (
    normalized.includes("previous") ||
    normalized.includes("senior assignment")
  ) {
    return "previousAssignments";
  }
  if (normalized.includes("years as gm")) return "yearsAsGm";
  if (normalized.includes("speciaity") || normalized.includes("specialty")) {
    return "specialty";
  }
  if (normalized === "keys" || normalized.includes("number of keys")) {
    return "numberOfKeys";
  }
  if (normalized.includes("opening")) return "openingExperience";
  if (normalized.includes("capex") || normalized.includes("refurb")) {
    return "capexRefurbExperience";
  }
  if (normalized.startsWith("language")) return "languages";
  if (normalized.includes("linkedin")) return "linkedinUrl";
  if (normalized === "email") return "email";
  if (normalized.startsWith("phone")) return "phone";
  if (normalized === "status") return "personalStatus";
  if (normalized.includes("blackout")) return "blackoutDates";
  if (
    normalized.includes("enrolment") ||
    normalized.includes("enrollment")
  ) {
    return "enrolmentDate";
  }
  if (normalized === "notes") return "notes";
  return null;
}

function parseSheetGrid(
  sheetXml: string,
  sharedStrings: string[],
  hyperlinks: Map<string, string>,
): Map<number, Map<string, Cell>> {
  const grid = new Map<number, Map<string, Cell>>();
  const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
  let match: RegExpExecArray | null;

  while ((match = cellRe.exec(sheetXml))) {
    const attrs = match[1];
    const inner = match[2] ?? "";
    const ref = attr(attrs, "r");
    if (!ref) continue;
    const parsed = parseCellRef(ref);
    if (!parsed) continue;

    const type = attr(attrs, "t");
    const raw = cellRawValue(inner, type, sharedStrings);
    const hyperlink = hyperlinks.get(ref) ?? null;
    if (!raw && !hyperlink) continue;

    const rowCells = grid.get(parsed.row) ?? new Map<string, Cell>();
    rowCells.set(parsed.col, { text: raw, hyperlink });
    grid.set(parsed.row, rowCells);
  }

  return grid;
}

function cellRawValue(
  inner: string,
  type: string | null,
  sharedStrings: string[],
): string {
  if (type === "s") {
    const index = Number(firstMatch(inner, /<v\b[^>]*>([\s\S]*?)<\/v>/i));
    return Number.isFinite(index) ? (sharedStrings[index] ?? "") : "";
  }

  if (type === "inlineStr") {
    return decodeXml(
      [...inner.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((item) => item[1])
        .join(""),
    );
  }

  const value = firstMatch(inner, /<v\b[^>]*>([\s\S]*?)<\/v>/i);
  return value ? decodeXml(value) : "";
}

function parseSharedStrings(xml: string): string[] {
  if (!xml) return [];
  const values: string[] = [];
  const blockRe = /<si\b[^>]*>([\s\S]*?)<\/si>/g;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(xml))) {
    const text = [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((item) => decodeXml(item[1]))
      .join("");
    values.push(text);
  }
  return values;
}

function parseHyperlinks(
  sheetXml: string,
  relsXml: string,
): Map<string, string> {
  const targets = new Map<string, string>();
  const relRe =
    /<Relationship\b([^>]*)\/?>/g;
  let relMatch: RegExpExecArray | null;
  while ((relMatch = relRe.exec(relsXml))) {
    const id = attr(relMatch[1], "Id");
    const target = attr(relMatch[1], "Target");
    if (id && target) {
      targets.set(id, target);
    }
  }

  const links = new Map<string, string>();
  const linkRe = /<hyperlink\b([^>]*)\/?>/g;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRe.exec(sheetXml))) {
    const ref = attr(linkMatch[1], "ref");
    const id = attr(linkMatch[1], "r:id") ?? attr(linkMatch[1], "id");
    const display = attr(linkMatch[1], "display");
    if (!ref) continue;
    const target = (id ? targets.get(id) : null) ?? display;
    if (target) {
      links.set(ref, target);
    }
  }

  return links;
}

function relationshipTarget(relsXml: string, rid: string): string | null {
  const relRe = /<Relationship\b([^>]*)\/?>/g;
  let match: RegExpExecArray | null;
  while ((match = relRe.exec(relsXml))) {
    if (attr(match[1], "Id") === rid) {
      return attr(match[1], "Target");
    }
  }
  return null;
}

function parseCellRef(
  ref: string,
): { col: string; row: number } | null {
  const match = ref.trim().match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  return { col: match[1].toUpperCase(), row: Number(match[2]) };
}

function cellText(
  grid: Map<number, Map<string, Cell>>,
  row: number,
  col: string,
): string {
  return grid.get(row)?.get(col)?.text.trim() ?? "";
}

function attr(source: string, name: string): string | null {
  const match = source.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? decodeXml(match[1]) : null;
}

function firstMatch(source: string, pattern: RegExp): string | null {
  const match = source.match(pattern);
  return match?.[1] ?? null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, code) =>
      String.fromCharCode(Number(code)),
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function isExcelSerial(value: string): boolean {
  if (!/^\d+(\.\d+)?$/.test(value)) return false;
  const number = Number(value);
  return number > 20000 && number < 80000;
}

function excelSerialToDate(serial: number): string {
  const utc = Date.UTC(1899, 11, 30) + Math.round(serial) * 86400000;
  return new Date(utc).toISOString().slice(0, 10);
}
