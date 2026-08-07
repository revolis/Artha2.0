import type { EntryAttachment } from "@/lib/types"

const MAX_EDGE = 900
const QUALITY = 0.82

/**
 * Attachments used to be plain file names. Entries saved before that changed —
 * and the seed data — still hold strings, so anything read back is coerced
 * rather than trusted.
 */
export function normaliseAttachments(raw: unknown): EntryAttachment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((item): EntryAttachment | null => {
      if (typeof item === "string") return { name: item }
      if (item && typeof item === "object" && "name" in item) {
        const { name, dataUrl } = item as EntryAttachment
        return typeof name === "string" ? { name, dataUrl } : null
      }
      return null
    })
    .filter((item): item is EntryAttachment => item !== null)
}

/**
 * Reads an image file into a downscaled data URL. Full-size photos would blow
 * past the localStorage quota within a few entries, so the long edge is capped
 * and it is re-encoded as JPEG.
 */
export function readAttachment(file: File): Promise<EntryAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () =>
        reject(new Error(`${file.name} isn't a readable image.`))
      image.onload = () => {
        const scale = Math.min(
          1,
          MAX_EDGE / Math.max(image.width, image.height)
        )
        const canvas = document.createElement("canvas")
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)

        const context = canvas.getContext("2d")
        if (!context) {
          reject(new Error("Could not process that image."))
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve({
          name: file.name,
          dataUrl: canvas.toDataURL("image/jpeg", QUALITY),
        })
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}
