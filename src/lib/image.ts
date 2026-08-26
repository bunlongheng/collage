/** Read a picked image file to a data URL.
 *
 * iPhones shoot HEIC/HEIF. iOS Safari (the target) decodes those natively in
 * <img> and on the export canvas, and typically hands the file picker a JPEG
 * anyway - so the file is used as-is, no conversion step and no heavy decoder
 * dependency. */
export async function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("could not read image"));
    reader.readAsDataURL(file);
  });
}

/** True for a file we can turn into a photo (images incl. HEIC/HEIF). */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}
