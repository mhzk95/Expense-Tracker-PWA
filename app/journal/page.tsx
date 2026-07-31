"use client";

import { useState, useRef, useEffect } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils/helpers";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
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
  Clock,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";

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
      await audioRef.current.play().catch(() => { });
      setPlaying(true);
    }
  };

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  const bars = waveformData && waveformData.length > 0 ? waveformData : Array.from({ length: 32 }, () => Math.random() * 0.6 + 0.2);
  const barCount = 32;
  const step = Math.max(1, Math.floor(bars.length / barCount));
  const displayBars = Array.from({ length: barCount }, (_, i) => bars[i * step] ?? 0.3);
  const activeCount = Math.round(progress * barCount);

  return (
    <div className="flex items-center gap-3 mt-4 bg-[var(--color-bg)] rounded-[16px] px-3 py-2.5 border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] w-full overflow-hidden relative">
      <motion.button
        whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: "0px 0px 0px 0px var(--color-border)" }}
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="w-10 h-10 rounded-xl border-[3px] border-[var(--color-border)] bg-[var(--color-primary)] shadow-[2px_2px_0px_0px_var(--color-border)] flex items-center justify-center flex-shrink-0 transition-colors"
      >
        {playing
          ? <Pause className="w-5 h-5 text-black stroke-[4px]" />
          : <Play className="w-5 h-5 text-black fill-black stroke-[3px]" />
        }
      </motion.button>

      {/* Waveform bars */}
      <div className="flex items-center justify-between gap-[2px] h-6 flex-1 px-1">
        {displayBars.map((amp, i) => (
          <div
            key={i}
            className={cn(
              "w-[4px] rounded-full transition-colors duration-75",
              i < activeCount ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)] opacity-30"
            )}
            style={{ height: `${Math.max(4, amp * 24)}px` }}
          />
        ))}
      </div>

      <span className="text-[10px] sm:text-xs font-black uppercase text-[var(--color-text)] flex-shrink-0 ml-1 tracking-widest bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] px-2 py-1 rounded-md">
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
    <div className="w-full mb-6">
      <Card
        variant="surface"
        className="flex flex-col relative transition-all duration-200 border-[3px] border-[var(--color-border)] rounded-[20px] overflow-visible p-0 bg-[var(--color-surface)]"
      >
        {/* Header Ribbon (Time) */}
        <div className="absolute -top-3 -left-3 z-10 bg-[var(--color-primary)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] rounded-lg px-3 py-1 flex items-center gap-1.5 rotate-[-2deg]">
          <Clock className="w-3.5 h-3.5 text-black stroke-[3px]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-black whitespace-nowrap">{time}</span>
        </div>

        {/* Polaroid Image */}
        {photos.length > 0 && (
          <div
            className="w-full h-[220px] sm:h-[300px] border-b-[3px] border-[var(--color-border)] cursor-pointer relative overflow-hidden rounded-t-[17px]"
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
              <div className="absolute bottom-3 right-3 bg-[var(--color-primary)] border-[3px] border-[var(--color-border)] text-black text-[12px] font-black uppercase tracking-widest px-3 py-1 rounded-xl shadow-[2px_2px_0px_0px_var(--color-border)]">
                +{photos.length - 1} Photos
              </div>
            )}
          </div>
        )}

        {/* Content Box */}
        <div className={cn("p-5 sm:p-6", !photos.length && "pt-8")}>
          {/* Title & Menu */}
          <div className="flex items-start justify-between gap-3 relative">
            <h3 className="text-[var(--color-text)] font-black text-xl sm:text-2xl uppercase tracking-wide text-balance">
              {entry.title || (entry.event || "Untitled Memory")}
            </h3>
            <div className="relative flex-shrink-0">
              <motion.button
                whileTap={{ scale: 0.9, x: 1, y: 1, boxShadow: "0px 0px 0px 0px var(--color-border)" }}
                onClick={() => setShowMenu(v => !v)}
                className="w-10 h-10 flex items-center justify-center bg-[var(--color-surfaceHover)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] rounded-xl transition-colors"
              >
                <MoreVertical className="w-5 h-5 stroke-[3px] text-[var(--color-text)]" />
              </motion.button>

              <AnimatePresence>
                {showMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, x: 20, y: -20 }}
                      transition={{ type: "spring", bounce: 0.5, duration: 0.4 }}
                      className="absolute right-0 top-12 z-30 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] rounded-[16px] overflow-hidden origin-top-right min-w-[160px]"
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-sm font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 stroke-[3px]" /> Delete
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Location */}
          {locationDisplay && (
            <div className="flex items-center gap-2 mt-2">
              <MapPin className="w-4 h-4 text-[var(--color-primary)] stroke-[3px] flex-shrink-0" />
              <span className="text-sm font-bold text-[var(--color-text)] opacity-80 truncate">{locationDisplay}</span>
            </div>
          )}

          {/* Description */}
          {entry.content && (
            <div className="mt-4 bg-[var(--color-bg)] border-[3px] border-[var(--color-border)] rounded-[12px] p-4 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
              <p className="text-sm sm:text-base font-bold text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>
          )}

          {/* Audio player */}
          {entry.audioFileId && (
            <div className="mt-4">
              <AudioPlayer
                fileId={entry.audioFileId}
                durationMs={entry.audioDurationMs}
                waveformData={entry.waveformData}
              />
            </div>
          )}

          {/* Tags & Linked Transaction Row */}
          {(tags.length > 0 || linkedTxn) && (
            <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t-[3px] border-dashed border-[var(--color-border)]">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-black bg-[#a855f7] px-3 py-1.5 rounded-full border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]">
                  #{tag}
                </span>
              ))}

              {linkedTxn && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#22c55e] border-[3px] border-[var(--color-border)] rounded-full shadow-[2px_2px_0px_0px_var(--color-border)] max-w-full">
                  <LinkIcon className="w-3.5 h-3.5 text-black stroke-[3px] flex-shrink-0" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-black truncate max-w-[100px]">
                    {linkedTxn.description}
                  </span>
                  <span className="text-[10px] font-black text-black ml-1 bg-white/30 px-1.5 py-0.5 rounded-md border-2 border-black/20">
                    {formatCurrency(linkedTxn.amount, linkedTxn.currency)}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-5 right-5 p-3 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000] rounded-full text-black z-50"
          >
            <X className="w-6 h-6 stroke-[4px]" />
          </motion.button>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.4 }}
          >
            <TelegramLazyImage
              url={photos[0]}
              alt="Full"
              className="max-w-full max-h-[85vh] object-contain rounded-[16px] border-[4px] border-white"
              entryId={entry.id}
              photoIndex={0}
            />
          </motion.div>
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

  // Floating Date Pill Logic
  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [showPill, setShowPill] = useState(false);
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Get scroll top from either window (mobile) or the scrolling element (desktop)
      const target = e.target as HTMLElement | Document | Window;
      let currentScroll = 0;
      
      if (target === document || target === window) {
        currentScroll = window.scrollY || document.documentElement.scrollTop;
      } else {
        currentScroll = (target as HTMLElement).scrollTop || 0;
      }

      // Track active date based on visible elements
      // The active date is the FIRST group whose bottom edge is still visible (below the header)
      const elements = Array.from(document.querySelectorAll(".journal-date-group"));
      const activeElement = elements.find(el => {
        const rect = el.getBoundingClientRect();
        return rect.bottom > 140; // 140px threshold accounts for header + some padding
      });

      if (activeElement) {
        setActiveDate(activeElement.getAttribute("data-date"));
      }

      if (currentScroll > 80) {
        setShowPill(true);
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
        scrollTimeout.current = setTimeout(() => setShowPill(false), 3000);
      } else {
        setShowPill(false);
      }
    };
    
    // Use capture phase to catch scroll events from any scrollable container OR window
    window.addEventListener("scroll", handleScroll, true);
    
    // Trigger once on mount to set initial active date (only runs once now)
    handleScroll({ target: document } as unknown as Event);
    
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring", bounce: 0.4 } }
  };

  return (
    <div className="pb-32 relative">
      <div className="w-full">
        {/* Dynamic Global Date Pill */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ 
            opacity: showPill && activeDate ? 1 : 0, 
            y: showPill && activeDate ? 0 : -20 
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-20 left-0 right-0 z-50 flex justify-center pointer-events-none"
        >
          <span className="bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-black text-[var(--color-text)] uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--color-border)]">
            {activeDate}
          </span>
        </motion.div>

        <PageHeader
          title="Journal"
          subtitle={loading ? "Loading..." : `${entries.length} memories`}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setShowSearch(v => !v)}
              >
                <Search className="w-5 h-5 stroke-[3px]" />
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsFormOpen(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                Add
              </Button>
            </div>
          }
        />

        {/* Search bar (collapsible) */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: "auto", opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="relative overflow-hidden"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black stroke-[3px]" />
                <Input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="SEARCH MEMORIES..."
                  className="w-full pl-12 pr-12 font-black uppercase tracking-widest placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] rounded-lg transition-colors z-10"
                  >
                    <X className="w-5 h-5 stroke-[3px]" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mt-4 pt-1">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedTag(null)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full border-[3px] border-[var(--color-border)] text-xs font-black uppercase tracking-widest transition-all",
                !selectedTag
                  ? "bg-[var(--color-primary)] text-black shadow-[3px_3px_0px_0px_var(--color-border)]"
                  : "bg-[var(--color-surface)] text-gray-400 shadow-[2px_2px_0px_0px_var(--color-border)] hover:text-[var(--color-text)]"
              )}
            >
              All
            </motion.button>
            {allTags.map(tag => (
              <motion.button
                whileTap={{ scale: 0.95 }}
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full border-[3px] border-[var(--color-border)] text-xs font-black uppercase tracking-widest transition-all",
                  selectedTag === tag
                    ? "bg-[#a855f7] text-black shadow-[3px_3px_0px_0px_var(--color-border)]"
                    : "bg-[var(--color-surface)] text-gray-400 shadow-[2px_2px_0px_0px_var(--color-border)] hover:text-[var(--color-text)]"
                )}
              >
                #{tag}
              </motion.button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col gap-8 mt-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full h-[250px] bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[20px] animate-pulse shadow-[4px_4px_0px_0px_var(--color-border)]" />
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
            className="text-center py-24 px-4 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[24px] mt-6"
          >
            <div className="w-24 h-24 bg-[var(--color-primary)] rounded-full flex items-center justify-center mx-auto mb-6 border-[3px] border-[var(--color-border)]">
              <span className="text-5xl">📸</span>
            </div>
            <h3 className="text-[var(--color-text)] font-black uppercase tracking-widest text-2xl mb-3">Void is Empty</h3>
            <p className="text-gray-400 font-bold text-sm mb-8 px-6">Capture your first brutal memory with a photo, voice note, or reflection.</p>
            <motion.button
              whileTap={{ scale: 0.95, x: 2, y: 2, boxShadow: "0px 0px 0px 0px var(--color-border)" }}
              onClick={() => setIsFormOpen(true)}
              className="px-8 py-4 bg-[var(--color-surface)] text-[var(--color-text)] font-black uppercase tracking-widest text-sm rounded-xl border-[3px] border-[var(--color-border)] transition-colors hover:bg-[var(--color-surfaceHover)]"
            >
              Add Memory
            </motion.button>
          </motion.div>
        ) : (
          <div className="mt-6">
            {groups.map(group => (
              <div key={group.label} data-date={group.label} className="mb-10 relative journal-date-group">
                {/* Entries */}
                <motion.div
                  initial="hidden"
                  animate="show"
                  variants={containerVariants}
                  className="flex flex-col gap-6"
                >
                  {group.entries.map((entry, idx) => (
                    <motion.div key={entry.id} variants={itemVariants}>
                      <EntryCard
                        entry={entry}
                        linkedTxn={entry.linkedTransactionId
                          ? transactions.find(t => t.id === entry.linkedTransactionId)
                          : null
                        }
                        onDelete={() => deleteEntry(entry.id)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            ))}
          </div>
        )}
      </div>

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
