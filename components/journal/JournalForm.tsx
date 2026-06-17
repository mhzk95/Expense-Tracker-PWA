"use client";

import { useState, useRef, useEffect } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { getImageCacheDB } from "@/lib/db/indexeddb";
import {
  useAudioRecorder,
  uploadAudioToTelegram,
  formatDuration,
} from "@/hooks/useAudioRecorder";
import {
  Image as ImageIcon,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  MapPin,
  X,
  RotateCcw,
  Lock,
} from "lucide-react";

const MOODS = [
  { label: "Happy", emoji: "😊" },
  { label: "Excited", emoji: "🤩" },
  { label: "Grateful", emoji: "🙏" },
  { label: "Calm", emoji: "😌" },
  { label: "Neutral", emoji: "😐" },
  { label: "Tired", emoji: "😴" },
  { label: "Sad", emoji: "😔" },
  { label: "Anxious", emoji: "😰" },
];

interface JournalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function JournalForm({ onSuccess, onCancel }: JournalFormProps) {
  const { addEntry } = useJournal();
  const { transactions } = useTransactions();
  const recorder = useAudioRecorder();

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<string>("");
  const [event, setEvent] = useState("");
  const [location, setLocation] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [photoBlobs, setPhotoBlobs] = useState<Blob[]>([]);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
  const [linkedTransactionId, setLinkedTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      photoPreviewUrls.forEach(u => URL.revokeObjectURL(u));
      if (audioObjectUrlRef.current) URL.revokeObjectURL(audioObjectUrlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const MAX = 1600;
      let w = img.width, h = img.height;
      if (w > h ? w > MAX : h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
        else { w = Math.round(w * MAX / h); h = MAX; }
      }
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        setPhotoBlobs(prev => [...prev, blob]);
        setPhotoPreviewUrls(prev => [...prev, URL.createObjectURL(blob)]);
      }, "image/webp", 0.75);
    };
    img.src = URL.createObjectURL(file);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    URL.revokeObjectURL(photoPreviewUrls[idx]);
    setPhotoBlobs(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) setTags(prev => [...prev, val]);
      setTagInput("");
    }
  };

  const fetchLocation = async () => {
    setLocationLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 8000 })
      );
      const { latitude, longitude } = pos.coords;
      // Reverse geocode via free Nominatim API (no key needed)
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const geo = await r.json();
      const place = geo.address?.suburb || geo.address?.neighbourhood || geo.address?.city_district || "";
      const city = geo.address?.city || geo.address?.town || geo.address?.village || "";
      const country = geo.address?.country || "";
      const displayName = [place, city, country].filter(Boolean).join(", ");
      setLocation(JSON.stringify({ lat: latitude, lng: longitude, place_name: place, city, country, display: displayName }));
    } catch {
      setLocation("");
    } finally {
      setLocationLoading(false);
    }
  };

  const getLocationDisplay = () => {
    if (!location) return null;
    try {
      const loc = JSON.parse(location);
      return loc.display || loc.city || loc.place_name || null;
    } catch { return location; }
  };

  const togglePlayback = () => {
    if (!recorder.result) return;
    if (!audioRef.current) {
      audioObjectUrlRef.current = URL.createObjectURL(recorder.result.blob);
      audioRef.current = new Audio(audioObjectUrlRef.current);
      audioRef.current.onended = () => setIsPlayingBack(false);
    }
    if (isPlayingBack) {
      audioRef.current.pause();
      setIsPlayingBack(false);
    } else {
      audioRef.current.play();
      setIsPlayingBack(true);
    }
  };

  const discardAudio = () => {
    audioRef.current?.pause();
    if (audioObjectUrlRef.current) { URL.revokeObjectURL(audioObjectUrlRef.current); audioObjectUrlRef.current = null; }
    audioRef.current = null;
    setIsPlayingBack(false);
    recorder.cancel();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && recorder.state !== "done") return;
    setIsSubmitting(true);

    try {
      // 1. Use blobs directly (background sync will upload them)
      const uploadedPhotoUrls: any[] = [...photoBlobs];

      // 2. Use audio blob directly
      let audioFileId: any | undefined;
      let waveformData: number[] | undefined;
      let audioDurationMs: number | undefined;
      
      if (recorder.state === "done" && recorder.result) {
        audioFileId = recorder.result.blob;
        waveformData = recorder.result.waveformData;
        audioDurationMs = recorder.result.durationMs;
      }

      // 3. Extract hashtags from content
      const extractedTags = (content.match(/#[\w\u00C0-\u024F]+/g) || [])
        .map(t => t.replace("#", "").toLowerCase());
      const finalTags = Array.from(new Set([...tags.map(t => t.toLowerCase()), ...extractedTags]));

      // 4. Save to IndexedDB (and sync will push to Supabase)
      await addEntry({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        title: title.trim() || undefined,
        content: content.trim(),
        tags: finalTags,
        photoUrls: uploadedPhotoUrls,
        linkedTransactionId: linkedTransactionId || undefined,
        mood: mood || undefined,
        event: event.trim() || undefined,
        location: location || undefined,
        audioFileId,
        audioDurationMs,
        waveformData,
      });

      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to save entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pb-6">
      {/* Cover Image Strip */}
      {photoPreviewUrls.length > 0 && (
        <div className="-mx-4 -mt-4 relative">
          <img
            src={photoPreviewUrls[0]}
            alt="Cover"
            className="w-full h-52 object-cover"
          />
          <button
            type="button"
            onClick={() => removePhoto(0)}
            className="absolute top-3 right-3 bg-black/60 p-1.5 rounded-full text-white"
          >
            <X className="w-4 h-4" />
          </button>
          {/* Additional photos */}
          {photoPreviewUrls.slice(1).length > 0 && (
            <div className="flex gap-2 p-3 overflow-x-auto bg-slate-950/60">
              {photoPreviewUrls.slice(1).map((url, i) => (
                <div key={i} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => removePhoto(i + 1)} className="absolute top-1 right-1 bg-black/60 p-0.5 rounded-full">
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full bg-transparent text-white text-xl font-semibold placeholder-slate-600 outline-none border-b border-slate-800/60 pb-2"
      />

      {/* Mood picker */}
      <div>
        <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">Mood</p>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map(m => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMood(mood === `${m.label} ${m.emoji}` ? "" : `${m.label} ${m.emoji}`)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                mood === `${m.label} ${m.emoji}`
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                  : "bg-slate-800/60 text-slate-400 hover:bg-slate-700"
              }`}
            >
              <span>{m.emoji}</span> {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Event + Location row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Event</label>
          <input
            type="text"
            value={event}
            onChange={e => setEvent(e.target.value)}
            placeholder="Dinner with friends..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500 outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={getLocationDisplay() || ""}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Paris, France"
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:ring-2 focus:ring-violet-500 outline-none"
            />
            <button
              type="button"
              onClick={fetchLocation}
              disabled={locationLoading}
              className="flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl px-3 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
              title="Detect Location"
            >
              <MapPin className={`w-4 h-4 ${locationLoading ? "animate-pulse text-violet-400" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Content textarea */}
      <textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        rows={4}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:ring-2 focus:ring-violet-500 outline-none resize-none placeholder-slate-600"
        placeholder="What's on your mind? Use #tags inline..."
      />

      {/* Audio Recorder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        {recorder.state === "idle" && (
          <button
            type="button"
            onClick={recorder.start}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <Mic className="w-4 h-4 text-red-400" />
            </div>
            Record a voice note
          </button>
        )}

        {(recorder.state === "recording" || recorder.state === "paused") && (
          <div className="space-y-3">
            {/* Live waveform */}
            <div className="flex items-center justify-center gap-0.5 h-12 overflow-hidden">
              {recorder.waveformData.slice(-60).map((amp, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all ${recorder.state === "recording" ? "bg-violet-400" : "bg-slate-600"}`}
                  style={{ height: `${Math.max(4, amp * 48)}px` }}
                />
              ))}
            </div>
            <div className="text-center text-white font-mono text-lg font-semibold">
              {formatDuration(recorder.durationMs)}
            </div>
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={recorder.cancel} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              {recorder.state === "recording" ? (
                <button type="button" onClick={recorder.pause} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Pause className="w-5 h-5" />
                </button>
              ) : (
                <button type="button" onClick={recorder.resume} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <Play className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={recorder.stop}
                className="w-12 h-12 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 transition-colors"
              >
                <Square className="w-5 h-5 text-white fill-white" />
              </button>
            </div>
            <p className="text-center text-xs text-slate-500">
              {recorder.state === "recording" ? "Recording..." : "Paused"}
            </p>
          </div>
        )}

        {recorder.state === "done" && recorder.result && (
          <div className="space-y-2">
            {/* Static waveform preview */}
            <div className="flex items-center gap-0.5 h-8 overflow-hidden justify-center">
              {recorder.waveformData.slice(0, 60).map((amp, i) => (
                <div key={i} className="w-1 rounded-full bg-violet-500/70" style={{ height: `${Math.max(2, amp * 32)}px` }} />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0"
              >
                {isPlayingBack ? <Pause className="w-3.5 h-3.5 text-white" /> : <Play className="w-3.5 h-3.5 text-white fill-white" />}
              </button>
              <div className="flex-1">
                <div className="text-xs text-slate-400">Voice note saved</div>
                <div className="text-xs text-slate-500 font-mono">{formatDuration(recorder.result.durationMs)}</div>
              </div>
              <button type="button" onClick={discardAudio} className="text-slate-500 hover:text-red-400 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs">
                #{tag}
                <button type="button" onClick={() => setTags(prev => prev.filter(t => t !== tag))}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagInput}
          onChange={e => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none placeholder-slate-600"
          placeholder="Add #tags (press space or enter)..."
        />
      </div>

      {/* Photo + Transaction row */}
      <div className="flex items-center gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer hover:text-white transition-colors">
          <div className="p-2 bg-slate-800 rounded-lg">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span>Photo</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>

        <div className="flex-1">
          <select
            value={linkedTransactionId}
            onChange={e => setLinkedTransactionId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 focus:ring-2 focus:ring-violet-500 outline-none appearance-none"
          >
            <option value="">Link transaction (optional)</option>
            {transactions.slice(0, 50).map(txn => (
              <option key={txn.id} value={txn.id}>
                {new Date(txn.date).toLocaleDateString()} — {txn.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submit */}
      <div className="pt-2 border-t border-slate-800/60 space-y-3">
        <button
          type="submit"
          disabled={isSubmitting || (!content.trim() && recorder.state !== "done")}
          className="w-full bg-slate-800 hover:bg-violet-600 text-white font-semibold rounded-2xl py-4 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
        >
          <Lock className="w-4 h-4" />
          {isSubmitting ? "Saving memory..." : "Save Memory"}
        </button>
        <p className="text-center text-xs text-slate-600 flex items-center justify-center gap-1">
          <Lock className="w-3 h-3" /> Private & encrypted
        </p>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="hidden"
        id="journal-form-cancel"
      />
    </form>
  );
}
