import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebaseAdmin"
import { getStorage } from "firebase-admin/storage"

export const runtime = "nodejs"

const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png"])

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }
    const token = authHeader.split("Bearer ")[1]
    const decoded = await adminAuth.verifyIdToken(token)
    const uid = decoded.uid

    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier envoyé" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Formats acceptés : JPG, PNG" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Taille max : 2 MB" }, { status: 400 })
    }

    const bucket = getStorage().bucket()
    const filenameSafe = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`
    const storagePath = `pros/${uid}/photos/${filenameSafe}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const storageFile = bucket.file(storagePath)

    await storageFile.save(buffer, {
      metadata: { contentType: file.type },
    })

    await storageFile.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`

    const proRef = adminDb.collection("pros").doc(uid)
    const proSnap = await proRef.get()
    const currentImages: string[] = proSnap.data()?.gallery?.images || []
    const updatedImages = [...currentImages, publicUrl]

    await proRef.update({
      "gallery.images": updatedImages,
      updated_at: new Date(),
    })

    return NextResponse.json({ url: publicUrl, images: updatedImages })
  } catch (err: any) {
    console.error("[API/photos/upload] Error:", err?.message || err)
    return NextResponse.json(
      { error: err?.message || "Erreur lors de l'upload" },
      { status: 500 }
    )
  }
}
