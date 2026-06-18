"use client";

import { useState, useRef, useEffect } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils/helpers";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { JournalForm } from "@/components/journal/JournalForm";
import { TelegramLazyImage } from "@/components/ui/TelegramLazyImage";
import { JournalEntity } from "@/lib/db/indexeddb";
import { formatDuration } from "@/hooks/useAudioRecorder";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  X,
  MapPin,
  Play,
  Pause,
  Trash2,
  Link as LinkIcon,
  MoreVertical,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/helpers";

// ─── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({ fileId, durationMs, waveformData }: {
  fileId: any;
  durationMs?: number;
  waveformData?: number[];
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    if (fileId instanceof Blob) {
      setSrc(URL.createObjectURL(fileId));
    } else if (typeof fileId === "string") {
      const telegramFileId = fileId.replace("telegram:", "");
      setSrc(`/api/image/${encodeURIComponent(telegramFileId)}`);
    }
  }, [fileId]);

  const toggle = async () => {
    if (!src) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(src);
      audioRef.current.ontimeupdate = () => {
        const dur = audioRef.current!.duration || (durationMs ? durationMs / 1000 : 1);
        setProgress(audioRef.current!.currentTime / dur);
      };
      audioRef.current.onended = () => { setPlaying(false); setProgress(0); };
    }
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      await audioRef.current.play().catch(() => {});
      setPlaying(true);
    }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const bars = waveformData && waveformData.length > 0 ? waveformData : Array.from({ length: 24 }, () => Math.random() * 0.6 + 0.2);
  const barCount = 24;
  const step = Math.max(1, Math.floor(bars.length / barCount));
  const displayBars = Array.from({ length: barCount }, (_, i) => bars[i * step] ?? 0.3);
  const activeCount = Math.round(progress * barCount);

  return (
    <div className="flex items-center gap-1 sm:gap-1.5 mt-1.5 bg-slate-950/60 rounded-lg px-1.5 sm:px-2 py-1 sm:py-1.5 border border-slate-800/40 w-fit max-w-full overflow-hidden">
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="w-5 h-5 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center flex-shrink-0 transition-colors shadow-md"
      >
        {playing
          ? <Pause className="w-2.5 h-2.5 text-white" />
          : <Play className="w-2.5 h-2.5 text-white fill-white" />
        }
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[1px] sm:gap-[2px] h-4">
        {displayBars.map((amp, i) => (
          <div
            key={i}
            className={`w-[2px] rounded-full transition-colors ${i < activeCount ? "bg-violet-400" : "bg-slate-700"}`}
            style={{ height: `${Math.max(3, amp * 16)}px` }}
          />
        ))}
      </div>

      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-1">
        {formatDuration(durationMs ?? 0)}
      </span>
    </div>
  );
}

// ─── Entry Card ───────────────────────────────────────────────────────────────

function EntryCard({ entry, linkedTxn, onDelete }: {
  entry: JournalEntity;
  linkedTxn: any;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const time = new Date(entry.date).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  const getLocationDisplay = () => {
    if (!entry.location) return null;
    try {
      const loc = JSON.parse(entry.location);
      return loc.display || loc.city || loc.place_name || null;
    } catch { return null; }
  };

  const locationDisplay = getLocationDisplay();
  const photos = entry.photoUrls || [];
  const tags = entry.tags || [];

  return (
    <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-5 group w-full overflow-hidden relative">
      {/* Left Column: Time & Timeline Line */}
      <div className="w-[55px] sm:w-[75px] flex-shrink-0 flex flex-col items-end relative">
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 w-full justify-end">
          <span className="text-[9px] sm:text-[10px] font-medium text-slate-500 flex-shrink-0 whitespace-nowrap">{time}</span>
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-violet-500 ring-2 ring-violet-500/30 z-10 flex-shrink-0" />
        </div>
        {/* The continuous line extending down */}
        <div className="absolute right-[2px] sm:right-[3px] top-5 sm:top-6 bottom-[-20px] sm:bottom-[-28px] w-px bg-slate-800/60" />
      </div>

      {/* Right Column: Card */}
      <div className="flex-1 min-w-0 glass-card rounded-2xl interactive p-2 sm:p-2.5 flex gap-2 sm:gap-3 relative">
        {/* Cover Image Thumbnail (Left) */}
        {photos.length > 0 && (
          <div
            className="w-[70px] h-[80px] sm:w-[100px] sm:h-[110px] bg-black flex-shrink-0 cursor-pointer relative rounded-lg sm:rounded-xl overflow-hidden"
            onClick={() => setLightbox(true)}
          >
            <TelegramLazyImage
              url={photos[0]}
              alt="Memory"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              entryId={entry.id}
              photoIndex={0}
            />
            {photos.length > 1 && (
              <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full">
                +{photos.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content (Right) */}
        <div className="flex-1 min-w-0 py-1 pr-1">
          {/* Title & Menu */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-white font-semibold text-sm truncate">
              {entry.title || (entry.event || "Memory")}
            </h3>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-0.5 text-slate-600 hover:text-slate-300 rounded-md transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                  />
                  <div className="absolute right-0 top-6 z-30 glass-card min-w-[100px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-400 hover:bg-slate-800 transition-colors font-medium"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {locationDisplay && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-violet-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-400 truncate">{locationDisplay}</span>
            </div>
          )}

          {/* Description */}
          {entry.content && (
            <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2 leading-relaxed">
              {entry.content}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-medium text-violet-400/80 bg-violet-400/10 px-1.5 py-0.5 rounded-md border border-violet-400/20">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Audio player */}
          {entry.audioFileId && (
            <AudioPlayer
              fileId={entry.audioFileId}
              durationMs={entry.audioDurationMs}
              waveformData={entry.waveformData}
            />
          )}

          {/* Linked transaction */}
          {linkedTxn && (
            <div className="mt-2 py-1 px-2 bg-slate-950/60 rounded-lg border border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <LinkIcon className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="text-[10px] text-slate-400 truncate">{linkedTxn.description}</span>
              </div>
              <span className="text-[10px] font-bold text-white flex-shrink-0 ml-2">
                {formatCurrency(linkedTxn.amount, linkedTxn.currency)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white">
            <X className="w-5 h-5" />
          </button>
          <TelegramLazyImage
            url={photos[0]}
            alt="Full"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            entryId={entry.id}
            photoIndex={0}
          />
        </div>
      )}
    </div>
  );
}

// ─── Date Group ───────────────────────────────────────────────────────────────

function groupByDate(entries: JournalEntity[]): { label: string; entries: JournalEntity[] }[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups: Record<string, JournalEntity[]> = {};
  for (const entry of entries) {
    const d = new Date(entry.date);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = "Today";
    else if (d.toDateString() === yesterday.toDateString()) label = "Yesterday";
    else label = formatDate(entry.date, "long");
    if (!groups[label]) groups[label] = [];
    groups[label].push(entry);
  }

  return Object.entries(groups).map(([label, entries]) => ({ label, entries }));
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function JournalPage() {
  const { entries, loading: journalLoading, deleteEntry } = useJournal();
  const { transactions, loading: txLoading } = useTransactions();
  const loading = journalLoading || txLoading;
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags || [])));

  const filteredEntries = entries.filter(e => {
    if (selectedTag && !(e.tags || []).includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qTag = q.replace(/^#/, "");
      if (
        !(e.content || "").toLowerCase().includes(q) &&
        !(e.title || "").toLowerCase().includes(q) &&
        !(e.tags || []).some(t => t.toLowerCase().includes(qTag))
      ) return false;
    }
    return true;
  });

  const groups = groupByDate(filteredEntries);

  return (
    <div className="pb-32 min-h-screen relative overflow-hidden flex flex-col">
      
      {/* Sticky Header / Search Area */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md pt-4 pb-2 px-2 sm:px-4 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-white">Journal</h1>
            <p className="text-xs text-slate-500">
              {loading ? "Loading..." : `${entries.length} memories`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(v => !v)}
              className="p-2.5 text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Search className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Search bar (collapsible) */}
        {showSearch && (
          <div className="relative mt-3 mb-1 animate-in slide-in-from-top-2 fade-in duration-200">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mt-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                !selectedTag ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"
              }`}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === tag ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Feed */}
      <div className="px-1 sm:px-4 pt-4 sm:pt-6 overflow-hidden flex-1">
        {loading ? (
          <div className="flex flex-col gap-6 px-2 sm:px-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-3">
                <div className="w-[60px] flex-shrink-0" />
                <div className="flex-1 h-[130px] glass-card animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-800">
              <span className="text-3xl">📔</span>
            </div>
            <h3 className="text-white font-semibold text-lg mb-2">No memories yet</h3>
            <p className="text-slate-500 text-sm mb-6">Capture your first memory with a photo, voice note, or reflection.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors shadow-md"
            >
              Capture a memory
            </button>
          </div>
        ) : (
          <div>
            {groups.map(group => {
              const isCollapsed = collapsedDays[group.label];
              return (
                <div key={group.label} className="mb-2 relative">
                  {/* Date label */}
                  <button 
                    onClick={() => setCollapsedDays(prev => ({ ...prev, [group.label]: !prev[group.label] }))}
                    className="flex items-center gap-3 mb-4 ml-[65px] sm:ml-[85px] w-full text-left group/btn"
                  >
                    <span className="text-xs font-semibold text-slate-500 group-hover/btn:text-slate-400 transition-colors uppercase tracking-wider flex items-center gap-1">
                      {group.label}
                    </span>
                    <div className="flex-1 h-px bg-slate-800/60 group-hover/btn:bg-slate-700/60 transition-colors mr-4 sm:mr-8" />
                  </button>

                  {/* Entries (Animated) */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        {group.entries.map((entry, idx) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            linkedTxn={entry.linkedTransactionId
                              ? transactions.find(t => t.id === entry.linkedTransactionId)
                              : null
                            }
                            onDelete={() => deleteEntry(entry.id)}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => setIsFormOpen(true)}
        className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 w-14 h-14 bg-violet-600 hover:bg-violet-500 active:scale-95 rounded-full shadow-2xl shadow-violet-500/40 flex items-center justify-center z-[60] transition-all"
        aria-label="Add journal entry"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* New Entry Sheet */}
      <AdaptiveOverlay
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Capture a memory"
      >
        <JournalForm
          onSuccess={() => setIsFormOpen(false)}
          onCancel={() => setIsFormOpen(false)}
        />
      </AdaptiveOverlay>
    </div>
  );
}
