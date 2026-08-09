"use client"

// Turning a picked file into something worth storing.
//
// A phone photo is several megabytes and nothing here displays one larger than
// a few hundred pixels, so images are shrunk and re-encoded as JPEG before they
// are uploaded. That saves the user's storage quota and makes the picture
// appear faster when it is read back.

/** Fills a square, cropping from the centre — for avatars. */
interface SquareOptions {
  mode: "square"
  /** Width and height of the result. */
  size: number
  quality: number
}

/** Fits inside a box, keeping the shape — for attachments. */
interface FitOptions {
  mode: "fit"
  /** Cap on the longer edge. Smaller images are left alone. */
  maxEdge: number
  quality: number
}

export type ResizeOptions = SquareOptions | FitOptions

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.onload = () => {
      const image = new window.Image()
      image.onerror = () =>
        reject(new Error(`${file.name} isn't a readable image.`))
      image.onload = () => resolve(image)
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

/** Reads a picked file and returns it shrunk, as a JPEG blob. */
export async function resizeToJpeg(
  file: File,
  options: ResizeOptions
): Promise<Blob> {
  const image = await loadImage(file)
  const canvas = document.createElement("canvas")

  if (options.mode === "square") {
    // The largest centred square the picture contains, scaled to fit. Cropping
    // rather than squashing, since an avatar is drawn in a circle.
    const edge = Math.min(image.width, image.height)
    canvas.width = options.size
    canvas.height = options.size
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not process that image.")
    context.drawImage(
      image,
      (image.width - edge) / 2,
      (image.height - edge) / 2,
      edge,
      edge,
      0,
      0,
      options.size,
      options.size
    )
  } else {
    const scale = Math.min(
      1,
      options.maxEdge / Math.max(image.width, image.height)
    )
    canvas.width = Math.round(image.width * scale)
    canvas.height = Math.round(image.height * scale)
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Could not process that image.")
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error("Could not process that image."))
      },
      "image/jpeg",
      options.quality
    )
  })
}
