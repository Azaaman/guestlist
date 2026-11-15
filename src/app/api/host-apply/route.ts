// Host applications: POST the form with ID, proof of ownership and house photos; GET its review status.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { HOST_LIMITS, HOST_THEMES, NEIGHBORHOODS, type HostFiles, type HostForm } from "@/lib/hosting";

export const maxDuration = 60;

const BUCKET = "host-documents";
const HOST = "host";
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

// Private bucket for IDs, ownership papers and house photos. Created on first use.
async function ensureBucket() {
  const { data } = await db().storage.getBucket(BUCKET);
  if (!data)
    await db().storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: Math.round(HOST_LIMITS.maxFileMB * 1024 * 1024),
    });
}

function files(fd: FormData, key: string) {
  return fd.getAll(key).filter((v): v is File => typeof v === "object" && "arrayBuffer" in v && v.size > 0);
}

// A host application: details, documents and photos. It waits for a moderator.
export async function POST(req: Request) {
  try {
    const fd = await req.formData();
    const form = JSON.parse(String(fd.get("form") ?? "{}")) as HostForm;
    const id = files(fd, "id");
    const ownership = files(fd, "ownership");
    const photos = files(fd, "photos");

    if (!form.name?.trim() || !form.email?.trim() || !form.phone?.trim() || !form.address?.trim())
      return NextResponse.json(
        { error: "Fill in your name, email, phone and the address of the house." },
        { status: 400 },
      );
    if (!NEIGHBORHOODS.includes(form.neighborhood))
      return NextResponse.json({ error: "Choose the neighborhood." }, { status: 400 });
    const theme = HOST_THEMES.find((t) => t.theme === form.theme);
    if (!theme || !theme.titles.includes(form.title))
      return NextResponse.json(
        { error: "Choose a theme and a name for your night from the list." },
        { status: 400 },
      );
    if (!(form.capacity >= 8 && form.capacity <= 60))
      return NextResponse.json({ error: "Capacity must be between 8 and 60 guests." }, { status: 400 });
    if (id.length !== 1)
      return NextResponse.json({ error: "Upload one photo or scan of your government ID." }, { status: 400 });
    if (ownership.length !== 1)
      return NextResponse.json(
        {
          error:
            form.occupancy === "owner"
              ? "Upload a document that shows you own the house."
              : "Upload your lease or the landlord's written permission.",
        },
        { status: 400 },
      );
    if (photos.length < HOST_LIMITS.minPhotos || photos.length > HOST_LIMITS.maxPhotos)
      return NextResponse.json(
        { error: `Upload ${HOST_LIMITS.minPhotos} to ${HOST_LIMITS.maxPhotos} photos of the house.` },
        { status: 400 },
      );
    for (const f of [...id, ...ownership, ...photos]) {
      if (!OK_TYPES.includes(f.type))
        return NextResponse.json({ error: `${f.name}: use a JPG, PNG or PDF.` }, { status: 400 });
      if (f.size > HOST_LIMITS.maxFileMB * 1024 * 1024)
        return NextResponse.json(
          { error: `${f.name} is too large. Keep each file under ${HOST_LIMITS.maxFileMB} MB.` },
          { status: 400 },
        );
    }

    await ensureBucket();
    const folder = crypto.randomUUID();
    const upload = async (f: File, name: string) => {
      const ext = f.type === "application/pdf" ? "pdf" : f.type.split("/")[1].replace("jpeg", "jpg");
      const path = `${folder}/${name}.${ext}`;
      const { error } = await db()
        .storage.from(BUCKET)
        .upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
      if (error) throw new Error(`Upload failed: ${error.message}`);
      return path;
    };
    const stored: HostFiles = {
      id: [await upload(id[0], "id")],
      ownership: [await upload(ownership[0], "ownership")],
      photos: await Promise.all(photos.map((p, i) => upload(p, `photo-${i + 1}`))),
    };

    const clean: HostForm = {
      name: form.name.trim().slice(0, 60),
      email: form.email.trim().slice(0, 80),
      phone: form.phone.trim().slice(0, 30),
      neighborhood: form.neighborhood,
      address: form.address.trim().slice(0, 160),
      capacity: Math.round(form.capacity),
      occupancy: form.occupancy === "owner" ? "owner" : "renter",
      theme: form.theme,
      title: form.title,
      about: (form.about ?? "").trim().slice(0, 500),
      profileId: form.profileId || undefined,
    };
    const { data, error } = await db()
      .from("applications")
      .insert({ party_id: HOST, form: clean, votes: { files: stored }, status: "pending" })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "The application could not be sent." },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { data } = await db()
    .from("applications")
    .select("id,form,status,trust")
    .eq("id", id)
    .eq("party_id", HOST)
    .maybeSingle();
  if (!data) return NextResponse.json({ error: "Application not found" }, { status: 404 });
  return NextResponse.json({
    id: data.id,
    form: data.form,
    status: data.status,
    note: (data.trust as { note?: string } | null)?.note ?? null,
  });
}
