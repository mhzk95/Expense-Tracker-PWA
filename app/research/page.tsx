"use client";

import { useEffect, useState, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useResearch } from "@/hooks/useResearch";
import { Link2, LayoutGrid, List, FileText, ExternalLink, Trash2, Folder, FolderPlus, Pin, Inbox, ChevronLeft, ArrowRight, Search, X, Bell, MoreHorizontal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
import Fuse from "fuse.js";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
import { Button } from "@/components/ui/Button";
import { useReminders } from "@/hooks/useReminders";
import { CommandBar } from "@/components/ui/CommandBar";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      vibrate([10]);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg transition-colors flex-shrink-0"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400 animate-in zoom-in-50 duration-200" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function ResearchItemCard({ item, view, topics, openMenuId, setOpenMenuId, updateItem, deleteItem, addReminder, setShareItem, setIsEditingDetails, getSuggestedTopics }: any) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const isImage = item.type === "image" || item.type === "screenshot";
  const isQuote = item.type === "quote";
  const isLink = item.type === "link";
  const suggestedTopics = !item.topicId ? getSuggestedTopics(item.title || "", item.content || "") : [];

  const handleCopy = async (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      vibrate([10]);
    } catch (err) {}
  };

  const isPinned = item.isPinned;
  const textColor = isPinned ? 'text-black' : 'text-[var(--color-text)]';
  const textMuted = isPinned ? 'text-black/70' : 'text-gray-500';

  return (
    <AnimatedCard className={`${view === "grid" ? "break-inside-avoid mb-4 sm:mb-4 w-full" : "w-full"} relative group bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[12px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none flex flex-col justify-between transition-all duration-300 !overflow-visible ${isPinned ? 'ring-2 ring-black bg-[var(--color-primary)]' : ''}`}>
      
      {/* Action Menu Toggle */}
      <div className={`absolute top-2 right-2 z-20 ${isPinned || openMenuId === item.id ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
        <button 
          onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
          className={`p-1 rounded-md border-2 border-transparent transition-all ${isPinned ? 'text-black hover:border-black/50 hover:bg-black/10' : 'text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)]'}`}
        >
          <MoreHorizontal className="h-4 w-4 stroke-[2.5px]" />
        </button>

        {openMenuId === item.id && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[12px] overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right z-50">
            <button onClick={(e) => { e.preventDefault(); updateItem(item.id, { isPinned: !isPinned }); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors">
              <Pin className="h-3.5 w-3.5 stroke-[3px]" /> {isPinned ? "Unpin Item" : "Pin Item"}
            </button>
            <button onClick={(e) => { e.preventDefault(); setShareItem(item); setIsEditingDetails(true); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors">
              <FileText className="h-3.5 w-3.5 stroke-[3px]" /> Edit / Move
            </button>
            <button onClick={(e) => { e.preventDefault(); if(confirm("Add a reminder?")) { addReminder({
              id: crypto.randomUUID(),
              title: `Review: ${item.title || "Research Item"}`,
              priority: "medium",
              contextTags: ["research"],
              isRecurring: false,
              status: "pending",
              dueDate: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString(),
              linkedItemId: item.id,
              linkedItemType: "research"
            }); vibrate([50]); } setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors">
              <Bell className="h-3.5 w-3.5 stroke-[3px]" /> Add Reminder
            </button>
            <div className="h-[2px] bg-[var(--color-border)] w-full my-1"></div>
            {item.title && <button onClick={(e) => { handleCopy(item.title || "", e); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"><Copy className="h-3.5 w-3.5 stroke-[3px]" /> Copy Title</button>}
            {item.content && <button onClick={(e) => { handleCopy(item.content || "", e); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"><Copy className="h-3.5 w-3.5 stroke-[3px]" /> Copy Content</button>}
            {item.url && <button onClick={(e) => { handleCopy(item.url || "", e); setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"><Link2 className="h-3.5 w-3.5 stroke-[3px]" /> Copy Link</button>}
            <div className="h-[2px] bg-[var(--color-border)] w-full my-1"></div>
            <button onClick={(e) => { e.preventDefault(); if(confirm("Delete item?")) { deleteItem(item.id); } setOpenMenuId(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 text-red-500 transition-colors">
              <Trash2 className="h-3.5 w-3.5 stroke-[3px]" /> Delete
            </button>
          </div>
        )}
      </div>

      {item.imageUrl && (isImage || isLink) && (
        <div className="w-full relative h-24 sm:h-32 shrink-0 overflow-hidden rounded-t-[10px] border-b-2 border-[var(--color-border)] bg-[var(--color-surface)]">
          <img src={item.imageUrl} alt={item.title || "Image"} className="w-full h-full object-cover" style={{ objectPosition: "top" }} />
        </div>
      )}

      <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5 pr-8">
          {item.domain && (
            <div className={`flex items-center gap-1 overflow-hidden ${isPinned ? 'bg-black/10 border-black/20' : 'bg-[var(--color-surfaceHover)] border-[var(--color-border)]'} border px-1 py-0.5 rounded shadow-sm`}>
              <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`} className="w-3 h-3 rounded-sm" alt="" />
              <span className={`text-[9px] font-bold ${textColor} uppercase tracking-widest truncate`}>{item.domain}</span>
            </div>
          )}
          {item.topicId && (
            <span className={`text-[9px] font-bold ${isPinned ? 'text-black' : 'text-[var(--color-primary)]'} uppercase tracking-widest truncate max-w-[80px]`}>
              {topics?.find((t: any) => t.id === item.topicId)?.title}
            </span>
          )}
        </div>

        {isQuote ? (
          <blockquote className={`text-xs sm:text-sm ${textColor} font-bold italic border-l-4 ${isPinned ? 'border-black' : 'border-[var(--color-primary)]'} pl-3 py-1 pr-1 line-clamp-3 mb-2`}>
            "{item.content}"
          </blockquote>
        ) : (
          <>
            <h3 className={`${textColor} break-all font-black leading-tight ${view === "grid" ? "text-sm line-clamp-2" : "text-base"} pr-6 mb-1.5`}>{item.title}</h3>
            {item.content && !isImage && !detailsOpen && (
              <p className={`text-[11px] font-bold ${textMuted} leading-snug mb-2 line-clamp-2`}>{item.content}</p>
            )}
          </>
        )}
        
        <div className="mt-auto">
          {(item.content || item.ocrText || item.url) && (
            <div>
              <button 
                onClick={(e) => { e.preventDefault(); setDetailsOpen(!detailsOpen); }} 
                className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest ${textColor} hover:opacity-80 transition-opacity`}
              >
                {detailsOpen ? <ChevronUp className="w-3 h-3 stroke-[3px]" /> : <ChevronDown className="w-3 h-3 stroke-[3px]" />}
                {detailsOpen ? "Hide Details" : "View Details"}
              </button>
              
              <AnimatePresence>
                {detailsOpen && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className={`mt-2 pt-2 border-t-2 ${isPinned ? 'border-black/20' : 'border-[var(--color-border)]'} space-y-2`}>
                      {item.content && (
                        <div>
                          <span className={`text-[9px] ${textMuted} font-black uppercase tracking-widest block mb-1`}>Notes / Content</span>
                          <p className={`text-xs font-bold ${textColor} whitespace-pre-wrap leading-relaxed`}>{item.content}</p>
                        </div>
                      )}
                      {item.ocrText && (
                        <div>
                          <span className={`text-[9px] ${textMuted} font-black uppercase tracking-widest block mb-1`}>Extracted Text</span>
                          <p className={`text-[10px] font-bold ${textColor} italic leading-relaxed`}>"{item.ocrText}"</p>
                        </div>
                      )}
                      {item.url && isLink && (
                        <Button onClick={() => window.open(item.url, "_blank")} variant={isPinned ? "secondary" : "primary"} size="sm" className="w-full mt-2 text-xs py-1.5 border-black/20">
                          Visit Link <ExternalLink className="h-3 w-3 stroke-[3px] ml-1.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!item.topicId && (
            <div className={`mt-2 pt-2 border-t-2 ${isPinned ? 'border-black/20' : 'border-[var(--color-border)]'}`}>
              <div className="flex flex-wrap gap-1.5">
                {suggestedTopics.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={(e) => { e.preventDefault(); updateItem(item.id, { topicId: t.id }); }}
                    className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md border-2 transition-colors ${isPinned ? 'bg-black/10 border-transparent hover:border-black/30 text-black' : 'bg-[var(--color-surfaceHover)] border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-black text-[var(--color-text)]'}`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { items, topics, loading, addItem, updateItem, deleteItem, addTopic } = useResearch();
  const { addReminder } = useReminders();

  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<"inbox" | "topics">("inbox");
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const [shareItem, setShareItem] = useState<any>(null);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const processedShareUrl = useRef<string | null>(null);

  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");

  // Handle Web Share Target
  useEffect(() => {
    const action = searchParams.get("action");
    const isSharedIdb = searchParams.get("shared") === "true";
    
    const url = searchParams.get("url");
    const text = searchParams.get("text");
    const title = searchParams.get("title");

    const isLegacyShare = action === "save" || (!action && !isSharedIdb && (title || text || url));

    // 1. Check for legacy query param share
    if (isLegacyShare) {
      if (!url && !text && !title) return;

      const signature = `query-${url}-${text}-${title}`;
      if (processedShareUrl.current === signature) return;
      processedShareUrl.current = signature;

      const extractUrl = (str: string | null) => {
        if (!str) return null;
        const match = str.match(/https?:\/\/[^\s]+/i);
        return match ? match[0] : null;
      };

      const contentUrl = url || extractUrl(text) || extractUrl(title);
      const itemType = contentUrl ? "link" : "note";

      let domain = "";
      if (contentUrl) {
        try {
          domain = new URL(contentUrl).hostname.replace("www.", "");
        } catch (e) { }
      }

      const newItemId = crypto.randomUUID();

      // Save immediately
      addItem({
        id: newItemId,
        type: itemType,
        url: contentUrl || undefined,
        domain: domain || undefined,
        title: title || (contentUrl ? "Shared Link" : "Shared Note"),
        content: text || ""
      } as any);

      vibrate([50, 50]);

      // Open the interactive Pro Clipper modal
      setShareItem({
        id: newItemId,
        url: contentUrl || undefined,
        domain: domain || undefined,
        title: title || (contentUrl ? "Shared Link" : "Shared Note"),
        content: text || ""
      });
      return;
    }

    // 2. Check for IDB share (intercepted by SW)
    if (isSharedIdb) {
      if (processedShareUrl.current === "idb-share") return;
      processedShareUrl.current = "idb-share";

      const processIdbShare = async () => {
        try {
          const { getDB } = await import('@/lib/db/indexeddb');
          const db = await getDB();
          const tx = db.transaction('syncMetadata', 'readwrite');
          const store = tx.objectStore('syncMetadata');
          const payload = await store.get('share_payload');
          
          if (!payload) return;
          
          // Clear payload so we don't re-process later
          await store.delete('share_payload');
          await tx.done;

          const extractUrl = (str: string | null) => {
            if (!str) return null;
            const match = str.match(/https?:\/\/[^\s]+/i);
            return match ? match[0] : null;
          };

          const contentUrl = payload.url || extractUrl(payload.text as string) || extractUrl(payload.title as string);
          const itemType = contentUrl ? "link" : "note";

          let domain = "";
          if (contentUrl) {
            try {
              domain = new URL(contentUrl).hostname.replace("www.", "");
            } catch (e) { }
          }

          const newItemId = crypto.randomUUID();

          let imageBlobUrl = "";
          if (payload.files && payload.files.length > 0) {
            const file = payload.files[0];
            try {
              const buffer = await file.arrayBuffer();
              const base64 = btoa(new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
              imageBlobUrl = `data:${file.type};base64,${base64}`;
            } catch (e) {
              console.error("Failed to process shared image file", e);
            }
          }

          const finalTitle = payload.title || (contentUrl ? "Shared Link" : "Shared Note");
          const finalContent = payload.text || "";

          // Save immediately
          addItem({
            id: newItemId,
            type: itemType,
            url: contentUrl || undefined,
            domain: domain || undefined,
            title: finalTitle,
            content: finalContent,
            imageUrl: imageBlobUrl || undefined,
          } as any);

          vibrate([50, 50]);

          // Open the interactive Pro Clipper modal
          setShareItem({
            id: newItemId,
            url: contentUrl || undefined,
            domain: domain || undefined,
            title: finalTitle,
            content: finalContent,
            imageUrl: imageBlobUrl || undefined,
          });

        } catch (err) {
          console.error("Failed to process IDB share", err);
        } finally {
          window.history.replaceState(null, '', '/research');
        }
      };
      processIdbShare();
    }
  }, [searchParams, addItem]);

  const closeShareModal = () => {
    setShareItem(null);
    window.history.replaceState(null, '', '/research');
  };

  const getSuggestedTopics = (itemTitle: string, itemContent: string) => {
    if (topics.length === 0) return [];
    const text = `${itemTitle} ${itemContent}`.toLowerCase();

    // Very simple keyword matching for auto-suggest
    const matches = topics.map(t => {
      let score = 0;
      const topicWords = t.title.toLowerCase().split(' ');
      topicWords.forEach(w => {
        if (text.includes(w)) score += 1;
      });
      return { topic: t, score };
    }).filter(t => t.score > 0).sort((a, b) => b.score - a.score);

    if (matches.length > 0) return matches.slice(0, 2).map(m => m.topic);
    return topics.slice(0, 2);
  };

  // Fuse Search instance
  const fuse = useMemo(() => {
    return new Fuse(items, {
      keys: ["title", "content", "ocrText", "url", "domain", "tags"],
      threshold: 0.3,
      ignoreLocation: true
    });
  }, [items]);

  const displayedItems = useMemo(() => {
    if (searchQuery.trim().length > 0) {
      return fuse.search(searchQuery).map(result => result.item);
    }
    if (activeTopicId) return items.filter(i => i.topicId === activeTopicId && !i.isArchived);
    if (activeTab === "inbox") return items.filter(i => !i.topicId && !i.isArchived);
    return [];
  }, [items, activeTab, activeTopicId, searchQuery, fuse]);

  if (loading) {
    return <ResearchSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title={searchQuery ? "Search Results" : (activeTopicId ? topics.find(t => t.id === activeTopicId)?.title || "Topic" : "Research Hub")}
        subtitle={searchQuery ? `${displayedItems.length} matches` : (activeTopicId ? `${displayedItems.length} items` : `${items.filter(i => !i.topicId).length} in Inbox`)}
        action={
          <div className="flex gap-2">
            <button onClick={() => setView("grid")} className={`p-2 rounded-xl border-2 border-[var(--color-border)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${view === "grid" ? "bg-[var(--color-primary)] text-black" : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"}`}><LayoutGrid className="h-5 w-5 stroke-[2.5px]" /></button>
            <button onClick={() => setView("list")} className={`p-2 rounded-xl border-2 border-[var(--color-border)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${view === "list" ? "bg-[var(--color-primary)] text-black" : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"}`}><List className="h-5 w-5 stroke-[2.5px]" /></button>
          </div>
        }
      />

      {/* Global Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search topics, links, text, and images..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full brutal-input rounded-2xl py-3 pl-11 pr-10 shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {!searchQuery && !activeTopicId && (
        <div className="flex bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] rounded-[16px] p-1 mb-6 gap-1">
          <Button
            onClick={() => setActiveTab("inbox")}
            variant={activeTab === "inbox" ? "primary" : "ghost"}
            className="flex-1 rounded-[12px]"
          >
            <Inbox className="h-5 w-5 stroke-[2.5px] mr-2" /> Inbox
          </Button>
          <Button
            onClick={() => setActiveTab("topics")}
            variant={activeTab === "topics" ? "primary" : "ghost"}
            className="flex-1 rounded-[12px]"
          >
            <Folder className="h-5 w-5 stroke-[2.5px] mr-2" /> Topics
          </Button>
        </div>
      )}

      {!searchQuery && activeTopicId && (
        <Button onClick={() => setActiveTopicId(null)} variant="secondary" className="mb-4 w-fit">
          <ChevronLeft className="h-4 w-4 stroke-[3px] mr-2" /> Back to Topics
        </Button>
      )}

      {/* TOPICS VIEW */}
      {!searchQuery && activeTab === "topics" && !activeTopicId && (
        <div className="grid grid-cols-2 gap-4">
          {isCreatingTopic ? (
            <div className="flex flex-col items-center justify-center p-4 bg-[var(--color-primary)] border-2 border-[var(--color-border)] rounded-[16px]">
              <input
                autoFocus
                type="text"
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                placeholder="Topic Name..."
                className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-lg text-[var(--color-text)] text-sm font-black text-center placeholder-gray-500 mb-2 px-3 py-2 outline-none focus:"
                onKeyDown={e => {
                  if (e.key === "Enter" && newTopicName.trim()) {
                    addTopic({ id: crypto.randomUUID(), title: newTopicName.trim(), status: "active" });
                    setNewTopicName("");
                    setIsCreatingTopic(false);
                  }
                  if (e.key === "Escape") {
                    setIsCreatingTopic(false);
                    setNewTopicName("");
                  }
                }}
              />
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-text)]/80">Press Enter to save</p>
            </div>
          ) : (
            <button onClick={() => setIsCreatingTopic(true)} className="flex flex-col items-center justify-center p-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] border-dashed rounded-[16px] active:translate-x-1 active:translate-y-1 hover:bg-[var(--color-bg)] transition-all group">
              <div className="h-10 w-10 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surfaceHover)] flex items-center justify-center group-hover:bg-[var(--color-primary)] text-[var(--color-text)] group-hover:text-white mb-2 transition-colors ">
                <FolderPlus className="h-5 w-5 stroke-[2.5px]" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">New Topic</span>
            </button>
          )}

          {topics.map(topic => {
            const count = items.filter(i => i.topicId === topic.id && !i.isArchived).length;
            return (
              <button key={topic.id} onClick={() => setActiveTopicId(topic.id)} className="flex flex-col items-start p-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[var(--color-primary)] hover:text-black transition-all text-left group">
                <div className="p-2 bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] text-[var(--color-text)] rounded-xl mb-3  group-hover:bg-[var(--color-surface)] group-hover:text-[var(--color-primary)]">
                  <Folder className="h-5 w-5 stroke-[2.5px]" />
                </div>
                <h3 className="text-[var(--color-text)] group-hover:text-black font-black text-sm uppercase tracking-wide mb-1 line-clamp-1">{topic.title}</h3>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-black/80 uppercase tracking-wider">{count} items</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ITEMS VIEW (Inbox, Active Topic, or Search Results) */}
      {(searchQuery || activeTab === "inbox" || activeTopicId) && (
        <>
          {displayedItems.length === 0 ? (
            <div className="text-center p-10 bg-[var(--color-surface)] border-4 border-[var(--color-border)] border-dashed rounded-[24px]">
              <Search className="h-12 w-12 text-[var(--color-text)] mx-auto mb-4 stroke-[2.5px]" />
              <h3 className="text-[var(--color-text)] font-black text-lg uppercase tracking-widest mb-2">{searchQuery ? "No matching results" : (activeTopicId ? "Topic is empty" : "Inbox is empty")}</h3>
              <p className="text-sm font-bold text-gray-500">{searchQuery ? "Try searching for a different keyword." : (activeTopicId ? "Move items here from your inbox." : "Save links or notes to see them here.")}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Separate Pinned and Unpinned Items */}
              {(() => {
                const pinnedItems = displayedItems.filter(i => i.isPinned);
                const otherItems = displayedItems.filter(i => !i.isPinned);

                const renderMasonry = (itemsToRender: typeof displayedItems) => {
                  const renderCard = (item: typeof displayedItems[0]) => (
                    <ResearchItemCard 
                      key={item.id} 
                      item={item} 
                      view={view} 
                      topics={topics}
                      openMenuId={openMenuId}
                      setOpenMenuId={setOpenMenuId}
                      updateItem={updateItem}
                      deleteItem={deleteItem}
                      addReminder={addReminder}
                      setShareItem={setShareItem}
                      setIsEditingDetails={setIsEditingDetails}
                      getSuggestedTopics={getSuggestedTopics}
                    />
                  );

                  if (view !== "grid") {
                    return (
                      <motion.div layout className="space-y-4">
                        <AnimatePresence mode="popLayout">
                          {itemsToRender.map(renderCard)}
                        </AnimatePresence>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div layout className="columns-2 lg:columns-3 gap-3 sm:gap-4">
                      <AnimatePresence mode="popLayout">
                        {itemsToRender.map(renderCard)}
                      </AnimatePresence>
                    </motion.div>
                  );
                };

                return (
                  <>
                    {pinnedItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-widest mb-4 px-1">Pinned</h4>
                        {renderMasonry(pinnedItems)}
                      </div>
                    )}
                    {otherItems.length > 0 && (
                      <div>
                        {pinnedItems.length > 0 && <h4 className="text-xs font-black text-[var(--color-text)] uppercase tracking-widest mb-4 mt-8 px-1">Others</h4>}
                        {renderMasonry(otherItems)}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </>
      )}

      {/* PRO CLIPPER SHARE MODAL */}
      {shareItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] overflow-hidden shadow-[8px_8px_0px_0px_var(--color-border)] animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-4 border-b-2 border-[var(--color-border)] bg-[var(--color-bg)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-black text-[var(--color-text)] uppercase tracking-widest flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse border-2 border-[var(--color-border)]" />
                  Link Saved Instantly
                </span>
                <button onClick={closeShareModal} className="p-1.5 bg-[var(--color-surface)] hover:bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] text-[var(--color-text)] rounded-lg transition-all active:translate-x-0.5 active:translate-y-0.5">
                  <X className="h-5 w-5 stroke-[3px]" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                {shareItem.imageUrl ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface)] border-2 border-[var(--color-border)] ">
                    <img src={shareItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="p-3 bg-[var(--color-surface)] border-2 border-[var(--color-border)]  text-[var(--color-text)] rounded-xl shrink-0 mt-1">
                    <Link2 className="h-6 w-6 stroke-[2.5px]" />
                  </div>
                )}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    {isEditingDetails ? (
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          className="w-full border-2 border-[var(--color-border)] rounded-lg px-2 py-1 text-sm font-bold text-[var(--color-text)] focus: outline-none"
                          value={shareItem.title || ""}
                          onChange={(e) => {
                            setShareItem({ ...shareItem, title: e.target.value });
                            updateItem(shareItem.id, { title: e.target.value });
                          }}
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          className="w-full border-2 border-[var(--color-border)] rounded-lg px-2 py-1 text-sm font-bold text-[var(--color-text)] focus: outline-none"
                          value={shareItem.imageUrl || ""}
                          onChange={(e) => {
                            setShareItem({ ...shareItem, imageUrl: e.target.value });
                            updateItem(shareItem.id, { imageUrl: e.target.value });
                          }}
                          placeholder="Image URL"
                        />
                        <button onClick={() => setIsEditingDetails(false)} className="text-[10px] uppercase tracking-widest font-black text-[var(--color-text)] hover:underline mt-2">Done Editing</button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <h3 className="text-white font-medium line-clamp-2 leading-snug">{shareItem.title}</h3>
                          {shareItem.domain && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <img src={`https://www.google.com/s2/favicons?domain=${shareItem.domain}&sz=32`} className="w-3.5 h-3.5 rounded-sm" alt="" />
                              <span className="text-xs text-slate-400">{shareItem.domain}</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => setIsEditingDetails(true)} className="text-xs text-violet-400 whitespace-nowrap hover:text-violet-300">Edit</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5 bg-[var(--color-surface)]">
              <div>
                <label className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest mb-2 block">Quick File To Topic</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => {
                      updateItem(shareItem.id, { topicId: undefined });
                      closeShareModal();
                    }}
                    className="px-3 py-1.5 bg-[var(--color-surfaceHover)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] rounded-lg text-xs font-black uppercase tracking-widest transition-colors border-2 border-[var(--color-border)]  active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  >
                    Leave in Inbox
                  </button>
                  {getSuggestedTopics(shareItem.title, shareItem.content).map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        updateItem(shareItem.id, { topicId: t.id });
                        closeShareModal();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-black rounded-lg text-xs font-black uppercase tracking-widest transition-colors border-2 border-[var(--color-border)]  active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                    >
                      <Folder className="h-4 w-4 stroke-[2.5px]" />
                      {t.title}
                    </button>
                  ))}
                  {topics.length > getSuggestedTopics(shareItem.title, shareItem.content).length && (
                    <select
                      className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-text)] rounded-lg px-2 py-1.5 outline-none focus:"
                      value=""
                      onChange={(e) => {
                        updateItem(shareItem.id, { topicId: e.target.value });
                        closeShareModal();
                      }}
                    >
                      <option value="" disabled>Other topics...</option>
                      {topics.filter(t => !getSuggestedTopics(shareItem.title, shareItem.content).find(s => s.id === t.id)).map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest block">Content / Notes</label>
                  <CopyButton text={shareItem.content || ""} />
                </div>
                <textarea
                  placeholder="Content or notes..."
                  className="w-full h-24 border-2 border-[var(--color-border)] rounded-xl p-3 text-sm font-bold text-[var(--color-text)] focus: outline-none resize-none"
                  value={shareItem.content || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const hashtags = val.match(/#[\w-]+/g)?.map(t => t.slice(1)) || [];
                    setShareItem({ ...shareItem, content: val, tags: hashtags });
                    updateItem(shareItem.id, { content: val, tags: hashtags });
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest block">Extracted Text (OCR)</label>
                  <CopyButton text={shareItem.ocrText || ""} />
                </div>
                <textarea
                  placeholder="Paste or extract any text from image..."
                  className="w-full h-16 border-2 border-[var(--color-border)] rounded-xl p-3 text-sm font-bold text-[var(--color-text)] focus: outline-none resize-none"
                  value={shareItem.ocrText || ""}
                  onChange={(e) => {
                    setShareItem({ ...shareItem, ocrText: e.target.value });
                    updateItem(shareItem.id, { ocrText: e.target.value });
                  }}
                />
              </div>

              <button onClick={closeShareModal} className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 text-black border-2 border-[var(--color-border)] rounded-[16px] font-black uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Smart Entry Floating Button only on Research Page */}
      <CommandBar />
    </div>
  );
}

function ResearchSkeleton() {
  return (
    <div className="space-y-6 pb-20 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 bg-[var(--color-surfaceHover)] rounded-xl mb-2" />
          <div className="h-4 w-32 bg-[var(--color-surfaceHover)] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-[var(--color-surfaceHover)] rounded-xl" />
          <div className="h-9 w-9 bg-[var(--color-surfaceHover)] rounded-xl" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 w-full bg-[var(--color-surfaceHover)] rounded-2xl" />

      {/* Tab Switcher Skeleton */}
      <div className="h-10 w-full bg-[var(--color-surfaceHover)] rounded-xl" />

      {/* Grid items skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-[var(--color-surfaceHover)] rounded-2xl border-2 border-gray-300" />
        ))}
      </div>
    </div>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<ResearchSkeleton />}>
      <ResearchContent />
    </Suspense>
  );
}
