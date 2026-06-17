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
  ChevronLeft,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [tempLocationQuery, setTempLocationQuery] = useState("");
  const [customDate, setCustomDate] = useState<string>(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });

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

    // Load image immediately for fast UX
    setPhotoBlobs(prev => [...prev, file]);
    setPhotoPreviewUrls(prev => [...prev, URL.createObjectURL(file)]);
    e.target.value = "";
  };

  const removePhoto = (idx: number) => {
    const urlToRevoke = photoPreviewUrls[idx];
    setPhotoBlobs(prev => prev.filter((_, i) => i !== idx));
    setPhotoPreviewUrls(prev => prev.filter((_, i) => i !== idx));
    
    // Defer revoke to ensure React removes the img tag from DOM first
    setTimeout(() => {
      URL.revokeObjectURL(urlToRevoke);
    }, 100);
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
        date: new Date(customDate).toISOString(),
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
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (locName: string) => {
    setLocation(JSON.stringify({ display: locName }));
    setShowLocationPicker(false);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        {/* Cover Image Strip */}
        {photoPreviewUrls.length > 0 ? (
          <div className="-mx-4 -mt-4 relative mb-2">
            <img
              src={photoPreviewUrls[0]}
              alt="Cover"
              className="w-full h-44 object-cover"
            />
            <button
              type="button"
              onClick={() => removePhoto(0)}
              className="absolute top-3 right-3 bg-black/60 backdrop-blur-md p-1.5 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
            {/* Additional photos */}
            {photoPreviewUrls.slice(1).length > 0 && (
              <div className="flex gap-2 p-2 overflow-x-auto bg-slate-950/60 absolute bottom-0 left-0 right-0 backdrop-blur-sm">
                {photoPreviewUrls.slice(1).map((url, i) => (
                  <div key={i} className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-slate-800">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i + 1)} className="absolute top-0.5 right-0.5 bg-black/60 p-0.5 rounded-full">
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="-mx-4 -mt-4 mb-2">
            <label className="flex items-center justify-center w-full h-32 bg-slate-900/30 border-b border-slate-800/60 cursor-pointer hover:bg-slate-900/50 transition-colors">
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <div className="p-3 bg-slate-800 rounded-2xl shadow-inner"><ImageIcon className="w-6 h-6 text-slate-400" /></div>
                <span className="text-xs font-semibold uppercase tracking-wider">Add a photo</span>
              </div>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            </label>
          </div>
        )}

        {/* Audio Recorder */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center min-h-[100px] shadow-sm">
          {recorder.state === "idle" && (
            <button
              type="button"
              onClick={recorder.start}
              className="w-full flex flex-col items-center justify-center gap-2 py-2 text-sm font-medium text-slate-400 hover:text-violet-400 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                <Mic className="w-5 h-5 text-violet-400" />
              </div>
              <span className="text-xs">Record a voice note</span>
            </button>
          )}

          {(recorder.state === "recording" || recorder.state === "paused") && (
            <div className="w-full space-y-3">
              <div className="text-center text-white font-mono text-lg font-semibold tracking-wider">
                {formatDuration(recorder.durationMs)}
              </div>
              {/* Live waveform */}
              <div className="flex items-center justify-center gap-[2px] h-10 overflow-hidden px-4">
                {recorder.waveformData.slice(-40).map((amp, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${recorder.state === "recording" ? "bg-violet-500" : "bg-slate-600"}`}
                    style={{ height: `${Math.max(4, amp * 38)}px` }}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-6 pt-2">
                <button type="button" onClick={recorder.cancel} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={recorder.stop}
                  className="w-14 h-14 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center shadow-lg shadow-violet-500/30 transition-all active:scale-95"
                >
                  <Square className="w-5 h-5 text-white fill-white" />
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
              </div>
            </div>
          )}

          {recorder.state === "done" && recorder.result && (
            <div className="w-full flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-violet-500/20"
              >
                {isPlayingBack ? <Pause className="w-4 h-4 text-white fill-white" /> : <Play className="w-4 h-4 text-white fill-white ml-0.5" />}
              </button>
              <div className="flex-1 flex items-center gap-[2px] h-8 overflow-hidden">
                {recorder.waveformData.slice(0, 40).map((amp, i) => (
                  <div key={i} className="w-1 rounded-full bg-violet-500/80" style={{ height: `${Math.max(3, amp * 30)}px` }} />
                ))}
              </div>
              <div className="text-xs text-slate-400 font-mono flex-shrink-0">
                {formatDuration(recorder.result.durationMs)}
              </div>
              <button type="button" onClick={discardAudio} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors ml-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 2x2 Grid Metadata */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {/* Date & Time */}
          <div className="col-span-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col justify-center min-h-[64px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5"><Calendar className="w-3 h-3" /> Date & Time</span>
            <input type="datetime-local" value={customDate} onChange={e=>setCustomDate(e.target.value)} className="bg-transparent text-xs text-white outline-none w-full font-medium" />
          </div>

          {/* Location */}
          <button type="button" onClick={() => setShowLocationPicker(true)} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-left hover:bg-white/10 transition-all flex flex-col justify-center min-h-[64px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5"><MapPin className="w-3 h-3" /> Location</span>
            <span className="text-xs text-white truncate w-full font-medium">{getLocationDisplay() || "Add location..."}</span>
          </button>

          {/* Event */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col justify-center min-h-[64px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">Event <span className="lowercase font-normal opacity-70">(optional)</span></span>
            <input type="text" value={event} onChange={e=>setEvent(e.target.value)} placeholder="e.g. Dinner" className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500 font-medium" />
          </div>

          {/* Mood */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col justify-center min-h-[64px] relative">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">Mood</span>
            <select value={mood} onChange={e=>setMood(e.target.value)} className="bg-transparent text-xs text-white outline-none w-full appearance-none font-medium z-10 cursor-pointer">
              <option value="" className="bg-slate-900">Select mood...</option>
              {MOODS.map(m => <option key={m.label} value={`${m.label} ${m.emoji}`} className="bg-slate-900">{m.emoji} {m.label}</option>)}
            </select>
          </div>

          {/* Reflection */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col justify-center min-h-[64px]">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5 mb-0.5">Reflection <span className="lowercase font-normal opacity-70">(optional)</span></span>
            <textarea rows={1} value={content} onChange={e=>setContent(e.target.value)} placeholder="Grateful for..." className="bg-transparent text-xs text-white outline-none w-full placeholder-slate-500 resize-none font-medium overflow-hidden" />
          </div>
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && recorder.state !== "done" && photoBlobs.length === 0)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl py-4 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
          >
            <Lock className="w-4 h-4 text-slate-400" />
            {isSubmitting ? "Saving memory..." : "Save Memory"}
          </button>
          <p className="text-center text-[10px] text-slate-500 flex items-center justify-center gap-1 mt-3">
            <Lock className="w-2.5 h-2.5" /> Private & encrypted
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="hidden"
          id="journal-form-cancel"
        />
      </form>

      {/* Fluid Location Picker Overlay */}
      <AnimatePresence>
        {showLocationPicker && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-[-16px] z-50 bg-slate-950/95 backdrop-blur-xl border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 p-3 border-b border-slate-800/60 bg-slate-900/50">
              <button type="button" onClick={() => setShowLocationPicker(false)} className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800/50 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <input 
                type="text" 
                autoFocus 
                value={tempLocationQuery} 
                onChange={e => setTempLocationQuery(e.target.value)} 
                placeholder="Search location..." 
                className="flex-1 bg-transparent text-sm text-white font-medium outline-none placeholder-slate-500" 
              />
              <button 
                type="button" 
                onClick={async () => {
                  await fetchLocation();
                  setShowLocationPicker(false);
                }} 
                className={`p-1.5 rounded-full transition-colors ${locationLoading ? "bg-violet-500/20 text-violet-400 animate-pulse" : "bg-slate-800/50 text-violet-400 hover:bg-violet-500 hover:text-white"}`}
              >
                <MapPin className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 bg-slate-950 p-4 flex flex-col gap-1 overflow-y-auto">
              <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2 tracking-wider">Suggestions</div>
              {tempLocationQuery ? (
                <button type="button" onClick={() => handleLocationSelect(tempLocationQuery)} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium border border-slate-800/50 bg-slate-900/30">
                  <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-violet-400" /> {tempLocationQuery}</span>
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => handleLocationSelect("Current Location")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400" /> Current Location
                  </button>
                  <button type="button" onClick={() => handleLocationSelect("Home")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Home
                  </button>
                  <button type="button" onClick={() => handleLocationSelect("Work")} className="text-left text-sm text-white py-3 px-3 hover:bg-slate-900 rounded-xl transition-colors font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Work
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
