"use client";

/**
 * Journal Page — "AI Memory Journal" redesign
 *
 * Timeline-based feed grouped by date, with:
 * - Cover image (flush, 4:3)
 * - Audio player with static waveform
 * - Mood / event / location badges
 * - Inline tag chips
 *
 * Preserves all existing architecture: IndexedDB local-first,
 * Telegram CDN for media, Supabase via /api/sync.
 */

import { useState, useRef, useEffect } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatDate } from "@/lib/utils/helpers";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { JournalForm } from "@/components/journal/JournalForm";
import { TelegramLazyImage } from "@/components/ui/TelegramLazyImage";
import { JournalEntity } from "@/lib/db/indexeddb";
import { formatDuration } from "@/hooks/useAudioRecorder";
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
  ChevronDown,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/helpers";

// ─── Audio Player ─────────────────────────────────────────────────────────────

function AudioPlayer({ fileId, durationMs, waveformData }: {
  fileId: string;
  durationMs?: number;
  waveformData?: number[];
}) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const telegramFileId = fileId.replace("telegram:", "");

  const toggle = async () => {
    if (!audioRef.current) {
      const src = `/api/image/${encodeURIComponent(telegramFileId)}`;
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

  const bars = waveformData && waveformData.length > 0 ? waveformData : Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.2);
  const barCount = 40;
  const step = Math.max(1, Math.floor(bars.length / barCount));
  const displayBars = Array.from({ length: barCount }, (_, i) => bars[i * step] ?? 0.3);
  const activeCount = Math.round(progress * barCount);

  return (
    <div className="flex items-center gap-3 bg-slate-950/60 rounded-xl px-3 py-2.5">
      <button
        onClick={toggle}
        className="w-8 h-8 rounded-full bg-violet-600 hover:bg-violet-500 flex items-center justify-center flex-shrink-0 transition-colors shadow-md"
      >
        {playing
          ? <Pause className="w-3.5 h-3.5 text-white" />
          : <Play className="w-3.5 h-3.5 text-white fill-white" />
        }
      </button>

      {/* Waveform bars */}
      <div className="flex items-center gap-0.5 flex-1 h-7">
        {displayBars.map((amp, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-colors ${i < activeCount ? "bg-violet-400" : "bg-slate-700"}`}
            style={{ height: `${Math.max(3, amp * 28)}px` }}
          />
        ))}
      </div>

      <span className="text-xs font-mono text-slate-500 flex-shrink-0">
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
  const [expanded, setExpanded] = useState(false);
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
  const contentIsLong = entry.content.length > 180;
  const displayContent = contentIsLong && !expanded ? entry.content.slice(0, 180) + "…" : entry.content;

  return (
    <div className="flex gap-3 sm:gap-4">
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1 flex-shrink-0">
        <div className="w-2.5 h-2.5 rounded-full bg-violet-500 ring-2 ring-violet-500/30 mt-1" />
        <div className="flex-1 w-px bg-gradient-to-b from-violet-500/30 to-transparent mt-2 min-h-[40px]" />
      </div>

      {/* Card */}
      <div className="flex-1 bg-slate-900/70 border border-slate-800/60 rounded-2xl overflow-hidden mb-5 hover:border-slate-700/60 transition-colors">
        {/* Cover Image */}
        {entry.photoUrls.length > 0 && typeof entry.photoUrls[0] === "string" && (
          <div
            className="w-full aspect-[4/3] bg-black cursor-pointer relative overflow-hidden"
            onClick={() => setLightbox(true)}
          >
            <TelegramLazyImage
              url={entry.photoUrls[0] as string}
              alt="Memory"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              entryId={entry.id}
              photoIndex={0}
            />
            {/* Photo count badge */}
            {entry.photoUrls.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full">
                +{entry.photoUrls.length - 1}
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          {/* Header: time + mood + menu */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-500">{time}</span>
              {entry.mood && (
                <span className="text-xs font-medium text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-full">
                  {entry.mood}
                </span>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors relative z-20"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <>
                  {/* Invisible overlay for outside click to close */}
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                  />
                  <div className="absolute right-0 top-8 z-30 bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden min-w-[120px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(); setShowMenu(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          {entry.title && (
            <h3 className="text-white font-semibold text-base mb-1.5">{entry.title}</h3>
          )}

          {/* Location + Event badges */}
          {(locationDisplay || entry.event) && (
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              {locationDisplay && (
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <MapPin className="w-3 h-3 text-violet-400" />
                  {locationDisplay}
                </div>
              )}
              {entry.event && (
                <div className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">
                  {entry.event}
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {entry.content && (
            <div>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                {displayContent}
              </p>
              {contentIsLong && (
                <button
                  onClick={() => setExpanded(v => !v)}
                  className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 mt-1.5 transition-colors"
                >
                  {expanded ? "Show less" : "Read more"}
                  <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          )}

          {/* Audio player */}
          {entry.audioFileId && (
            <div className="mt-3">
              <AudioPlayer
                fileId={entry.audioFileId}
                durationMs={entry.audioDurationMs}
                waveformData={entry.waveformData}
              />
            </div>
          )}

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {entry.tags.map(tag => (
                <span key={tag} className="text-xs font-medium text-violet-400/80">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Linked transaction */}
          {linkedTxn && (
            <div className="mt-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400 truncate">{linkedTxn.description}</span>
              </div>
              <span className="text-xs font-bold text-white flex-shrink-0 ml-2">
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
            url={entry.photoUrls[0] as string}
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
  const { entries, loading, deleteEntry } = useJournal();
  const { transactions } = useTransactions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const allTags = Array.from(new Set(entries.flatMap(e => e.tags)));

  const filteredEntries = entries.filter(e => {
    if (selectedTag && !e.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qTag = q.replace(/^#/, "");
      if (
        !e.content.toLowerCase().includes(q) &&
        !e.title?.toLowerCase().includes(q) &&
        !e.tags.some(t => t.toLowerCase().includes(qTag))
      ) return false;
    }
    return true;
  });

  const groups = groupByDate(filteredEntries);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/40 px-4 pt-4 pb-3">
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
          <div className="relative mt-3 mb-1">
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
      <div className="px-4 pt-6">
        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-900/60 border border-slate-800/40 rounded-2xl h-48 animate-pulse" />
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
              className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl transition-colors"
            >
              Capture a memory
            </button>
          </div>
        ) : (
          <div>
            {groups.map(group => (
              <div key={group.label}>
                {/* Date label */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {group.label}
                  </span>
                  <div className="flex-1 h-px bg-slate-800/60" />
                </div>

                {/* Entries */}
                {group.entries.map(entry => (
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
              </div>
            ))}
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
