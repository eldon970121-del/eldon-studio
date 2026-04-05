import { useEffect, useMemo, useState } from "react";
import { StatusBadge } from "../components/pam/StatusBadge";
import { supabase } from "../lib/supabaseClient";
import {
  addNote,
  deleteImage,
  getSelections,
  insertImages,
  listImages,
  listNotes,
  togglePaid,
} from "../services/pamService";

function formatTimestamp(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
}

export function ProofManagerPage({ project, onBack }) {
  const [images, setImages] = useState([]);
  const [selections, setSelections] = useState([]);
  const [notes, setNotes] = useState([]);
  const [replyBody, setReplyBody] = useState("");
  const [replyImageId] = useState(null);
  const [uploading, setUploading] = useState(false);

  async function refreshData() {
    const [{ data: imageData }, { data: selectionData }, { data: noteData }] = await Promise.all([
      listImages(project.id),
      getSelections(project.id),
      listNotes(project.id),
    ]);

    setImages(Array.isArray(imageData) ? imageData : []);
    setSelections(Array.isArray(selectionData) ? selectionData : []);
    setNotes(Array.isArray(noteData) ? noteData : []);
  }

  useEffect(() => {
    refreshData();
  }, [project.id]);

  const selectedImageIds = useMemo(
    () => new Set(selections.map((selection) => String(selection.image_id))),
    [selections],
  );
  const selectedImages = useMemo(
    () => images.filter((image) => selectedImageIds.has(String(image.id))),
    [images, selectedImageIds],
  );
  const deliveryImages = useMemo(
    () => images.filter((image) => image.is_delivery),
    [images],
  );

  async function handleSendReply() {
    if (!replyBody.trim()) {
      return;
    }

    await addNote({
      projectId: project.id,
      imageId: replyImageId,
      author: "admin",
      body: replyBody.trim(),
    });
    setReplyBody("");
    await refreshData();
  }

  async function handleDeliveryUpload(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length || !supabase) {
      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const rows = [];

      for (const [index, file] of files.entries()) {
        const path = `proof/${project.id}/delivery_${timestamp}_${index}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("proof-images")
          .upload(path, file, { upsert: true });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("proof-images").getPublicUrl(path);

        rows.push({
          project_id: project.id,
          storage_path: path,
          preview_url: publicUrl,
          full_url: publicUrl,
          file_name: file.name,
          sort_order: images.length + index,
          is_delivery: true,
        });
      }

      await insertImages(rows);
      await refreshData();
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-[#131313] text-white">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#131313]/95 px-6 py-4 backdrop-blur md:px-12">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-white/60 transition hover:text-white"
          >
            ← {project.name}
          </button>
          <StatusBadge status={project.status} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-16 pt-8 md:px-12">
        <section>
          <h2 className="mb-4 font-serif text-xl">Client Selections</h2>
          {selectedImages.length === 0 ? (
            <p className="text-white/30">No selections yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
              {selectedImages.map((image) => (
                <img
                  key={image.id}
                  src={image.preview_url}
                  alt=""
                  className="aspect-square w-full object-cover"
                />
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-serif text-xl">Notes</h2>
          <div>
            {notes.map((note) => (
              <div key={note.id} className="mb-4 flex gap-3">
                <div className="w-14 pt-0.5 text-xs">
                  <span className={note.author === "admin" ? "text-white" : "text-white/40"}>
                    {note.author === "admin" ? "YOU" : "CLIENT"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white/70">{note.body}</p>
                  <p className="mt-1 text-xs text-white/20">{formatTimestamp(note.created_at)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <textarea
              rows={2}
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="Reply to client..."
              className="w-full resize-none border-b border-white/30 bg-transparent py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-white"
            />
            <button
              type="button"
              onClick={handleSendReply}
              className="mt-4 border border-white/30 px-4 py-2 text-sm transition hover:bg-white hover:text-black"
            >
              Send
            </button>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 font-serif text-xl">Final Delivery</h2>
          <p className="text-sm text-white/40">Upload high-res files for client download.</p>

          {deliveryImages.length > 0 ? (
            <div className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-5">
              {deliveryImages.map((image) => (
                <div key={image.id}>
                  <img src={image.preview_url} alt="" className="aspect-square w-full object-cover" />
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteImage(image.id);
                      await refreshData();
                    }}
                    className="mt-2 text-xs text-white/40 transition hover:text-white"
                  >
                    ✕ Remove
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <label className="mt-6 inline-block cursor-pointer border border-white/30 px-4 py-2 text-sm transition hover:bg-white hover:text-black">
            {uploading ? "Uploading..." : "＋ Add Delivery Files"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleDeliveryUpload}
              className="hidden"
            />
          </label>
        </section>

        <section className="mt-10 pb-16">
          <h2 className="mb-4 font-serif text-xl">Payment Status</h2>
          <div className="flex items-center gap-4">
            <StatusBadge status={project.status} />
            {!project.paid ? (
              <button
                type="button"
                onClick={async () => {
                  await togglePaid(project.id, true);
                  onBack();
                }}
                className="border border-white/30 px-4 py-2 text-sm transition hover:bg-white hover:text-black"
              >
                Mark as Paid — Unlock Download
              </button>
            ) : (
              <p className="text-green-400">Payment received ✓</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
