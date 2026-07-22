"use client";

import { useEffect, useState, Suspense, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { useResearch } from "@/hooks/useResearch";
import { Link2, LayoutGrid, List, FileText, ExternalLink, Trash2, Folder, FolderPlus, Pin, Inbox, ChevronLeft, ArrowRight, Search, X, Bell, MoreHorizontal, Copy, Check } from "lucide-react";
import { vibrate } from "@/lib/utils/helpers";
import Fuse from "fuse.js";
import { AnimatePresence, motion } from "framer-motion";
import { AnimatedCard } from "@/components/ui/AnimatedCard";
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
            <button onClick={() => setView("grid")} className={`p-2 rounded-xl border-2 border-[var(--color-border)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${view === "grid" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"}`}><LayoutGrid className="h-5 w-5 stroke-[2.5px]" /></button>
            <button onClick={() => setView("list")} className={`p-2 rounded-xl border-2 border-[var(--color-border)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none ${view === "list" ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"}`}><List className="h-5 w-5 stroke-[2.5px]" /></button>
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
        <div className="flex bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] rounded-[16px] p-1 mb-6">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-black uppercase tracking-widest transition-all ${activeTab === "inbox" ? "bg-[var(--color-primary)] border-2 border-[var(--color-border)] text-white " : "text-gray-500 hover:text-[var(--color-text)] border-2 border-transparent"}`}
          >
            <Inbox className="h-5 w-5 stroke-[2.5px]" /> Inbox
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-[12px] text-sm font-black uppercase tracking-widest transition-all ${activeTab === "topics" ? "bg-[var(--color-primary)] border-2 border-[var(--color-border)] text-white " : "text-gray-500 hover:text-[var(--color-text)] border-2 border-transparent"}`}
          >
            <Folder className="h-5 w-5 stroke-[2.5px]" /> Topics
          </button>
        </div>
      )}

      {!searchQuery && activeTopicId && (
        <button onClick={() => setActiveTopicId(null)} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-text)] bg-[var(--color-surface)] border-2 border-[var(--color-border)] px-4 py-2 rounded-xl hover:bg-[var(--color-surfaceHover)]  active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all mb-4 w-fit">
          <ChevronLeft className="h-4 w-4 stroke-[3px]" /> Back to Topics
        </button>
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
              <button key={topic.id} onClick={() => setActiveTopicId(topic.id)} className="flex flex-col items-start p-4 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] active:translate-x-1 active:translate-y-1 active:shadow-none hover:bg-[var(--color-primary)] hover:text-white transition-all text-left group">
                <div className="p-2 bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] text-[var(--color-text)] rounded-xl mb-3  group-hover:bg-[var(--color-surface)] group-hover:text-[var(--color-primary)]">
                  <Folder className="h-5 w-5 stroke-[2.5px]" />
                </div>
                <h3 className="text-[var(--color-text)] group-hover:text-white font-black text-sm uppercase tracking-wide mb-1 line-clamp-1">{topic.title}</h3>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-white/80 uppercase tracking-wider">{count} items</span>
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
                  const renderCard = (item: typeof displayedItems[0]) => {
                    const isImage = item.type === "image" || item.type === "screenshot";
                    const isQuote = item.type === "quote";
                    const isNote = item.type === "note" || item.type === "text";
                    const isLink = item.type === "link";
                    const suggestedTopics = !item.topicId ? getSuggestedTopics(item.title || "", item.content || "") : [];

                    return (
                      <AnimatedCard key={item.id} className={`${view === "grid" ? "break-inside-avoid mb-4 sm:mb-5 w-full" : "w-full"} relative group bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none flex flex-col justify-between transition-all duration-300 !overflow-visible ${item.isPinned ? 'ring-2 ring-black bg-[var(--color-primary)]' : ''}`}>

                        {/* Action Menu Toggle (Mobile & Hover) */}
                        <div className={`absolute top-3 right-3 z-20 ${item.isPinned || openMenuId === item.id ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                            className={`p-1.5 rounded-lg border-2 border-transparent transition-all ${item.isPinned ? 'text-white hover:border-white hover:bg-black/20' : 'text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)]'}`}
                          >
                            <MoreHorizontal className="h-5 w-5 stroke-[2.5px]" />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--color-surface)] border-4 border-[var(--color-border)] rounded-[16px] overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItem(item.id, { isPinned: !item.isPinned });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"
                              >
                                <Pin className="h-4 w-4 stroke-[3px]" /> {item.isPinned ? "Unpin Item" : "Pin Item"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShareItem(item);
                                  setIsEditingDetails(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"
                              >
                                <FileText className="h-4 w-4 stroke-[3px]" /> Edit / Move
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if(confirm("Add a reminder to review this tomorrow?")) {
                                    addReminder({
                                      id: crypto.randomUUID(),
                                      title: `Review: ${item.title || "Research Item"}`,
                                      priority: "medium",
                                      contextTags: ["research"],
                                      isRecurring: false,
                                      status: "pending",
                                      dueDate: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString(),
                                      linkedItemId: item.id,
                                      linkedItemType: "research"
                                    });
                                    vibrate([50]);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-[var(--color-surfaceHover)] text-[var(--color-text)] transition-colors"
                              >
                                <Bell className="h-4 w-4 stroke-[3px]" /> Add Reminder
                              </button>
                              <div className="h-1 bg-black w-full my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if(confirm("Are you sure you want to delete this item?")) {
                                    deleteItem(item.id);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-widest hover:bg-red-50 text-red-500 transition-colors"
                              >
                                <Trash2 className="h-4 w-4 stroke-[3px]" /> Delete Item
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Flush Image at the Top */}
                        {item.imageUrl && (isImage || isLink) && (
                          <div className="w-full relative h-32 sm:h-40 shrink-0 overflow-hidden rounded-t-[14px] border-b-2 border-[var(--color-border)] bg-[var(--color-surface)]">
                            <img src={item.imageUrl} alt={item.title || "Image"} className="w-full h-full object-cover" style={{ objectPosition: "top" }} />
                          </div>
                        )}

                        {/* Content Area */}
                        <div className="p-3 sm:p-4">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3 pr-12 sm:pr-16">
                            {item.domain && (
                              <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] px-1.5 py-0.5 rounded-[6px] shadow-[1px_1px_0px_0px_var(--color-border)]">
                                <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`} className="w-3 h-3 rounded-[3px]" alt="" />
                                <span className="text-[9px] sm:text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest truncate">{item.domain}</span>
                              </div>
                            )}
                            {item.topicId && searchQuery && (
                              <span className="text-[10px] font-black text-[var(--color-primary)] uppercase tracking-widest truncate max-w-[60px] sm:max-w-[80px]">
                                {topics.find(t => t.id === item.topicId)?.title}
                              </span>
                            )}
                          </div>

                          {isQuote ? (
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <blockquote className="text-sm sm:text-lg text-[var(--color-text)] font-black uppercase tracking-wide italic border-l-[6px] border-[var(--color-primary)] pl-4 py-2 pr-2 line-clamp-4 flex-1">
                                "{item.content}"
                              </blockquote>
                              <CopyButton text={item.content || ""} />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`text-[var(--color-text)] break-all font-black uppercase tracking-wide leading-snug ${view === "grid" ? "text-sm sm:text-lg line-clamp-2" : "text-base sm:text-xl"} pr-6 sm:pr-10 flex-1`}>{item.title}</h3>
                                <CopyButton text={item.title || ""} />
                              </div>
                              {item.content && !isImage && (
                                <div className="flex items-start justify-between gap-2 mt-2">
                                  <p className={`text-xs sm:text-sm font-bold text-gray-700 leading-relaxed whitespace-pre-wrap flex-1 ${view === "grid" ? "line-clamp-3 sm:line-clamp-4" : ""}`}>{item.content}</p>
                                  <CopyButton text={item.content || ""} />
                                </div>
                              )}
                            </>
                          )}

                          {/* OCR Text Display */}
                          {item.ocrText && (
                            <div className="mt-3 p-2 bg-[var(--color-surfaceHover)] rounded-lg border-2 border-[var(--color-border)] ">
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-[9px] text-[var(--color-text)] uppercase font-black tracking-widest flex items-center gap-1"><FileText className="h-3 w-3 stroke-[2.5px]" /> Extracted Text</p>
                                <CopyButton text={item.ocrText || ""} />
                              </div>
                              <p className="text-[11px] font-bold text-gray-700 line-clamp-3 italic leading-relaxed">"{item.ocrText}"</p>
                            </div>
                          )}

                          {item.url && isLink && (
                            <div className="flex items-center gap-2 mt-4">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover: border-2 border-[var(--color-border)] px-4 py-2 rounded-xl transition-all">
                                Visit Link <ExternalLink className="h-4 w-4 stroke-[3px]" />
                              </a>
                              <CopyButton text={item.url || ""} />
                            </div>
                          )}

                          {/* Topic Auto-Suggest Pills */}
                          {!item.topicId && !searchQuery && (
                            <div className="mt-5 pt-4 border-t-[3px] border-[var(--color-border)]">
                              <p className="text-[10px] text-gray-500 font-black mb-3 uppercase tracking-widest">Suggest filing to:</p>
                              <div className="flex flex-wrap gap-2 items-center">
                                {suggestedTopics.map(t => (
                                  <button
                                    key={t.id}
                                    onClick={() => updateItem(item.id, { topicId: t.id })}
                                    className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1.5 bg-[var(--color-surfaceHover)] hover:bg-[var(--color-primary)] text-[var(--color-text)] hover:text-white border-2 border-[var(--color-border)] rounded-[8px] transition-all "
                                  >
                                    {t.title} <ArrowRight className="h-3 w-3 stroke-[3px] opacity-80" />
                                  </button>
                                ))}
                                {topics.length > suggestedTopics.length && (
                                  <select
                                    className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-xs font-black uppercase tracking-widest text-[var(--color-text)] rounded-[8px] px-2 py-1.5 outline-none focus:"
                                    value=""
                                    onChange={(e) => updateItem(item.id, { topicId: e.target.value })}
                                  >
                                    <option value="" disabled>More...</option>
                                    {topics.filter(t => !suggestedTopics.find(s => s.id === t.id)).map(t => (
                                      <option key={t.id} value={t.id}>{t.title}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </AnimatedCard>
                    );
                  };

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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-white rounded-lg text-xs font-black uppercase tracking-widest transition-colors border-2 border-[var(--color-border)]  active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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

              <button onClick={closeShareModal} className="w-full py-3 bg-[var(--color-primary)] hover:brightness-110 text-white border-2 border-[var(--color-border)] rounded-[16px] font-black uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all">
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
