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
    <div className="flex items-center gap-2 mt-3 bg-[var(--color-surface)] rounded-[16px] px-3 py-2 border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] w-fit max-w-full overflow-hidden">
      <button
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="w-8 h-8 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-primary)] active:translate-x-0.5 active:translate-y-0.5 hover:bg-violet-500 flex items-center justify-center flex-shrink-0 transition-all shadow-[2px_2px_0px_0px_var(--color-border)] active:shadow-none"
      >
        {playing
          ? <Pause className="w-4 h-4 text-white stroke-[3px]" />
          : <Play className="w-4 h-4 text-white fill-white stroke-[3px]" />
        }
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-[2px] h-5 ml-1">
        {displayBars.map((amp, i) => (
          <div
            key={i}
            className={`w-[3px] rounded-full transition-colors ${i < activeCount ? "bg-[var(--color-primary)]" : "bg-gray-300"}`}
            style={{ height: `${Math.max(4, amp * 20)}px` }}
          />
        ))}
      </div>

      <span className="text-xs font-black text-[var(--color-text)] flex-shrink-0 ml-2 tracking-wide">
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
    <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 group w-full relative">
      {/* Left Column: Time & Timeline Line */}
      <div className="w-[55px] sm:w-[75px] flex-shrink-0 flex flex-col items-end relative">
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-2.5 w-full justify-end pr-2">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[var(--color-text)] flex-shrink-0 whitespace-nowrap">{time}</span>
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-[3px] border-[var(--color-border)] bg-[var(--color-surface)] z-10 flex-shrink-0" />
        </div>
        {/* The continuous line extending down */}
        <div className="absolute right-[5px] sm:right-[7px] top-6 sm:top-7 bottom-[-24px] sm:bottom-[-32px] w-[3px] bg-black" />
      </div>

      {/* Right Column: Card */}
      <Card variant="surface" className="flex-1 min-w-0 p-3 sm:p-4 flex gap-3 sm:gap-4 relative transition-all duration-300 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)]">
        {/* Cover Image Thumbnail (Left) */}
        {photos.length > 0 && (
          <div
            className="w-[80px] h-[90px] sm:w-[110px] sm:h-[120px] bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex-shrink-0 cursor-pointer relative rounded-[12px] sm:rounded-[16px] overflow-hidden shadow-[2px_2px_0px_0px_var(--color-border)]"
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
              <div className="absolute bottom-1 right-1 bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] text-[var(--color-text)] text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-lg shadow-[2px_2px_0px_0px_var(--color-border)]">
                +{photos.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content (Right) */}
        <div className="flex-1 min-w-0 py-1 pr-1">
          {/* Title & Menu */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[var(--color-text)] font-black text-lg uppercase tracking-wide text-balance truncate">
              {entry.title || (entry.event || "Memory")}
            </h3>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1 text-[var(--color-text)] hover:bg-gray-100 border-[2px] border-transparent hover:border-[var(--color-border)] rounded-lg transition-all"
              >
                <MoreVertical className="w-5 h-5 stroke-[2.5px]" />
              </button>
              {showMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                  />
                  <div className="absolute right-0 top-8 z-30 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] rounded-xl min-w-[140px] overflow-hidden py-1 animate-in fade-in duration-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-gray-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 stroke-[2.5px] text-red-500" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Location */}
          {locationDisplay && (
            <div className="flex items-center gap-1.5 mt-1">
              <MapPin className="w-4 h-4 text-[var(--color-text)] stroke-[3px] flex-shrink-0" />
              <span className="text-xs font-bold text-gray-700 truncate">{locationDisplay}</span>
            </div>
          )}

          {/* Description */}
          {entry.content && (
            <p className="text-sm font-medium text-[var(--color-text)] mt-2 line-clamp-2 leading-relaxed">
              {entry.content}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map(tag => (
                <span key={tag} className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)] bg-gray-100 px-2 py-1 rounded-md border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]">
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
            <div className="mt-3 py-2 px-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl shadow-[2px_2px_0px_0px_var(--color-border)] flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <LinkIcon className="w-4 h-4 text-[var(--color-text)] stroke-[2.5px] flex-shrink-0" />
                <span className="text-xs font-bold text-gray-800 truncate">{linkedTxn.description}</span>
              </div>
              <span className="text-sm font-black text-[var(--color-text)] flex-shrink-0 ml-2">
                {formatCurrency(linkedTxn.amount, linkedTxn.currency)}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-5 right-5 p-2 bg-[var(--color-surface)]/10 hover:bg-[var(--color-surface)]/20 rounded-full text-white">
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
      
      {/* Header Area */}
      <div className="pt-4 pb-4 px-2 sm:px-4">
        <PageHeader 
          title="Journal"
          subtitle={loading ? "Loading..." : `${entries.length} memories`}
          action={
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setShowSearch(v => !v)}
              className="transform -rotate-2"
            >
              <Search className="w-5 h-5 stroke-[2.5px]" />
            </Button>
          }
        />

        {/* Search bar (collapsible) */}
        {showSearch && (
          <div className="relative mt-4 mb-2 animate-in slide-in-from-top-2 fade-in duration-200">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 stroke-[2.5px]" />
            <Input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-12 pr-12 font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text)] hover:bg-gray-200 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5 stroke-[2.5px]" />
              </button>
            )}
          </div>
        )}

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mt-2">
            <Button
              variant={!selectedTag ? "primary" : "secondary"}
              size="sm"
              onClick={() => setSelectedTag(null)}
              className="flex-shrink-0 uppercase tracking-wider"
            >
              All
            </Button>
            {allTags.map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className="flex-shrink-0 uppercase tracking-wider"
              >
                #{tag}
              </Button>
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
                <div className="flex-1 h-[130px] brutal-card animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-20 px-4">
            <div className="w-24 h-24 bg-[var(--color-surface)] rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-[var(--color-border)] shadow-[6px_6px_0px_0px_var(--color-border)]">
              <span className="text-4xl">📔</span>
            </div>
            <h3 className="text-[var(--color-text)] font-black uppercase tracking-widest text-xl mb-2">No memories yet</h3>
            <p className="text-gray-600 font-bold text-sm mb-8">Capture your first memory with a photo, voice note, or reflection.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-6 py-3 bg-[var(--color-primary)] text-white font-black uppercase tracking-wider rounded-xl border-4 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
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
                    className="flex items-center gap-3 mb-6 ml-[65px] sm:ml-[85px] w-full text-left group/btn"
                  >
                    <span className="text-xs font-black text-[var(--color-text)] group-hover/btn:text-gray-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                      {group.label}
                    </span>
                    <div className="flex-1 h-1 bg-black group-hover/btn:bg-gray-800 transition-colors mr-4 sm:mr-8 rounded-full" />
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
        className="fixed bottom-24 right-5 sm:bottom-8 sm:right-8 w-14 h-14 bg-[var(--color-primary)] rounded-[16px] border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] flex items-center justify-center z-30 active:translate-x-1 active:translate-y-1 active:shadow-[0px_0px_0px_0px_var(--color-border)] transition-all transform -rotate-2"
        aria-label="Add journal entry"
      >
        <Plus className="w-6 h-6 text-black stroke-[3px]" />
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
