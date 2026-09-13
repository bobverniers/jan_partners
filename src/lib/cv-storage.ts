import { createSupabaseClient } from "@/lib/supabase/client";

export const CV_BUCKET = "cvs";
export const CV_MAX_BYTES = 10 * 1024 * 1024;
export const CV_ACCEPT =
  ".pdf,.doc,.docx,.odt,.rtf,.png,.jpg,.jpeg,application/pdf";

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  odt: "application/vnd.oasis.opendocument.text",
  rtf: "application/rtf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

const ALLOWED_MIMES = new Set(Object.values(EXT_TO_MIME));
ALLOWED_MIMES.add("text/rtf");

function extensionOf(fileName: string): string {
  const match = fileName.toLowerCase().match(/\.([a-z0-9]{1,5})$/);
  return match?.[1] ?? "";
}

export function validateCvFile(file: File): string | null {
  if (file.size > CV_MAX_BYTES) {
    return "CV files must be 10 MB or smaller.";
  }

  const ext = extensionOf(file.name);
  const mime = file.type;
  const mimeOk = mime ? ALLOWED_MIMES.has(mime) : false;
  const extOk = Boolean(ext && EXT_TO_MIME[ext]);

  if (!mimeOk && !extOk) {
    return "Upload a PDF, Word, or image file.";
  }

  return null;
}

function contentTypeFor(file: File): string {
  if (file.type && ALLOWED_MIMES.has(file.type)) {
    return file.type === "text/rtf" ? "application/rtf" : file.type;
  }
  return EXT_TO_MIME[extensionOf(file.name)] ?? "application/pdf";
}

function objectPath(personId: string, fileName: string): string {
  const ext = extensionOf(fileName);
  return `${personId}/cv${ext ? `.${ext}` : ".pdf"}`;
}

export async function uploadCvFile(personId: string, file: File) {
  const invalid = validateCvFile(file);
  if (invalid) {
    return { path: null as string | null, fileName: file.name, error: invalid };
  }

  const supabase = createSupabaseClient();
  await removeCvFiles(personId);

  const path = objectPath(personId, file.name);
  const { error } = await supabase.storage.from(CV_BUCKET).upload(path, file, {
    upsert: true,
    contentType: contentTypeFor(file),
  });

  return {
    path: error ? null : path,
    fileName: file.name,
    error: error?.message ?? null,
  };
}

export async function removeCvFiles(personId: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.storage.from(CV_BUCKET).list(personId);
  if (error || !data?.length) {
    return error?.message ?? null;
  }

  const { error: removeError } = await supabase.storage
    .from(CV_BUCKET)
    .remove(data.map((object) => `${personId}/${object.name}`));

  return removeError?.message ?? null;
}

export async function signedCvUrl(path: string) {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.storage
    .from(CV_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return {
    url: data?.signedUrl ?? null,
    error: error?.message ?? null,
  };
}
