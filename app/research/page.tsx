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
            <button onClick={() => setView("grid")} className={`p-2 rounded-xl ${view === "grid" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"}`}><LayoutGrid className="h-4 w-4" /></button>
            <button onClick={() => setView("list")} className={`p-2 rounded-xl ${view === "list" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-400"}`}><List className="h-4 w-4" /></button>
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
          className="w-full et-input rounded-2xl py-3 pl-11 pr-10 shadow-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white bg-slate-800 rounded-full transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {!searchQuery && !activeTopicId && (
        <div className="flex glass-card p-1 mb-6">
          <button
            onClick={() => setActiveTab("inbox")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "inbox" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
          >
            <Inbox className="h-4 w-4" /> Inbox
          </button>
          <button
            onClick={() => setActiveTab("topics")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "topics" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-slate-300"}`}
          >
            <Folder className="h-4 w-4" /> Topics
          </button>
        </div>
      )}

      {!searchQuery && activeTopicId && (
        <button onClick={() => setActiveTopicId(null)} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
          <ChevronLeft className="h-4 w-4" /> Back to Topics
        </button>
      )}

      {/* TOPICS VIEW */}
      {!searchQuery && activeTab === "topics" && !activeTopicId && (
        <div className="grid grid-cols-2 gap-4">
          {isCreatingTopic ? (
            <div className="flex flex-col items-center justify-center p-5 glass-card border border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
              <input
                autoFocus
                type="text"
                value={newTopicName}
                onChange={e => setNewTopicName(e.target.value)}
                placeholder="Topic Name..."
                className="w-full bg-transparent border-none text-white text-sm font-medium focus:ring-0 text-center placeholder:text-slate-500 mb-2 p-0"
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
              <p className="text-[10px] text-slate-500">Press Enter to save</p>
            </div>
          ) : (
            <button onClick={() => setIsCreatingTopic(true)} className="flex flex-col items-center justify-center p-6 glass-card !border-dashed !border-white/20 interactive group">
              <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-violet-500/20 text-slate-400 group-hover:text-violet-400 mb-3 transition-colors">
                <FolderPlus className="h-5 w-5" />
              </div>
              <span className="text-sm font-medium text-slate-300 group-hover:text-violet-300">New Topic</span>
            </button>
          )}

          {topics.map(topic => {
            const count = items.filter(i => i.topicId === topic.id && !i.isArchived).length;
            return (
              <button key={topic.id} onClick={() => setActiveTopicId(topic.id)} className="flex flex-col items-start p-5 glass-card interactive text-left group">
                <div className="p-2.5 bg-violet-500/10 text-violet-400 rounded-xl mb-3">
                  <Folder className="h-5 w-5" />
                </div>
                <h3 className="text-white font-medium mb-1 line-clamp-1">{topic.title}</h3>
                <span className="text-xs text-slate-500">{count} items</span>
              </button>
            )
          })}
        </div>
      )}

      {/* ITEMS VIEW (Inbox, Active Topic, or Search Results) */}
      {(searchQuery || activeTab === "inbox" || activeTopicId) && (
        <>
          {displayedItems.length === 0 ? (
            <div className="text-center p-10 glass-card">
              <Search className="h-10 w-10 text-slate-500 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-1">{searchQuery ? "No matching results" : (activeTopicId ? "Topic is empty" : "Inbox is empty")}</h3>
              <p className="text-sm text-slate-400">{searchQuery ? "Try searching for a different keyword." : (activeTopicId ? "Move items here from your inbox." : "Save links or notes to see them here.")}</p>
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
                      <AnimatedCard key={item.id} className={`${view === "grid" ? "break-inside-avoid mb-3 sm:mb-4 w-full" : "w-full"} relative group glass-card interactive flex flex-col justify-between transition-all duration-300 !overflow-visible ${item.isPinned ? 'ring-1 ring-violet-500 shadow-[0_4px_20px_rgba(139,92,246,0.15)]' : ''}`}>

                        {/* Action Menu Toggle (Mobile & Hover) */}
                        <div className={`absolute top-3 right-3 z-20 ${item.isPinned || openMenuId === item.id ? 'opacity-100' : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100'}`}>
                          <button 
                            onClick={(e) => { e.preventDefault(); setOpenMenuId(openMenuId === item.id ? null : item.id); }}
                            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden py-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  updateItem(item.id, { isPinned: !item.isPinned });
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-slate-700 text-slate-200 transition-colors"
                              >
                                <Pin className="h-4 w-4" /> {item.isPinned ? "Unpin Item" : "Pin Item"}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShareItem(item);
                                  setIsEditingDetails(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-slate-700 text-slate-200 transition-colors"
                              >
                                <FileText className="h-4 w-4" /> Edit / Move
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
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-slate-700 text-slate-200 transition-colors"
                              >
                                <Bell className="h-4 w-4" /> Add Reminder
                              </button>
                              <div className="h-px bg-slate-700/50 my-1"></div>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  if(confirm("Are you sure you want to delete this item?")) {
                                    deleteItem(item.id);
                                  }
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" /> Delete Item
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Flush Image at the Top */}
                        {item.imageUrl && (isImage || isLink) && (
                          <div className="w-full relative h-48 sm:h-64 shrink-0 overflow-hidden rounded-t-[inherit] border-b border-slate-800/50 bg-slate-950">
                            <img src={item.imageUrl} alt={item.title || "Image"} className="w-full h-full object-cover" style={{ objectPosition: "top" }} />
                          </div>
                        )}

                        {/* Content Area */}
                        <div className="p-3 sm:p-5">
                          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 pr-16 sm:pr-24">
                            {item.domain && (
                              <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden bg-slate-800/50 px-1.5 sm:px-2 py-1 rounded-md">
                                <img src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=32`} className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm" alt="" />
                                <span className="text-[10px] sm:text-xs font-medium text-slate-300 truncate">{item.domain}</span>
                              </div>
                            )}
                            {item.topicId && searchQuery && (
                              <span className="text-[9px] sm:text-[10px] font-bold text-violet-400 uppercase tracking-wider truncate max-w-[60px] sm:max-w-[80px]">
                                {topics.find(t => t.id === item.topicId)?.title}
                              </span>
                            )}
                          </div>

                          {isQuote ? (
                            <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                              <blockquote className="text-sm sm:text-lg text-slate-200 font-serif italic border-l-4 border-violet-500/50 pl-3 py-1 pr-2 line-clamp-4 flex-1">
                                "{item.content}"
                              </blockquote>
                              <CopyButton text={item.content || ""} />
                            </div>
                          ) : (
                            <>
                              <div className="flex items-start justify-between gap-2 mb-1.5 sm:mb-2">
                                <h3 className={`text-white break-all font-medium leading-snug ${view === "grid" ? "text-sm sm:text-lg line-clamp-2" : "text-base sm:text-xl"} pr-6 sm:pr-10 flex-1`}>{item.title}</h3>
                                <CopyButton text={item.title || ""} />
                              </div>
                              {item.content && !isImage && (
                                <div className="flex items-start justify-between gap-2 mt-1">
                                  <p className={`text-xs sm:text-sm text-slate-400 leading-relaxed whitespace-pre-wrap flex-1 ${view === "grid" ? "line-clamp-3 sm:line-clamp-4" : ""}`}>{item.content}</p>
                                  <CopyButton text={item.content || ""} />
                                </div>
                              )}
                            </>
                          )}

                          {/* OCR Text Display */}
                          {item.ocrText && (
                            <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-slate-950/40 rounded-xl border border-slate-800/50">
                              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                                <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase font-bold tracking-wider flex items-center gap-1"><FileText className="h-2.5 w-2.5 sm:h-3 sm:w-3" /> Extracted Text</p>
                                <CopyButton text={item.ocrText || ""} />
                              </div>
                              <p className="text-[10px] sm:text-xs text-slate-400 line-clamp-3 italic leading-relaxed">"{item.ocrText}"</p>
                            </div>
                          )}

                          {item.url && isLink && (
                            <div className="flex items-center gap-2 mt-3 sm:mt-4">
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-violet-400 hover:text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg transition-colors">
                                Visit Link <ExternalLink className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                              </a>
                              <CopyButton text={item.url || ""} />
                            </div>
                          )}

                          {/* Topic Auto-Suggest Pills */}
                          {!item.topicId && !searchQuery && (
                            <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-slate-800/50">
                              <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium mb-2 sm:mb-2.5 uppercase tracking-wider">Suggest filing to:</p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
                                {suggestedTopics.map(t => (
                                  <button
                                    key={t.id}
                                    onClick={() => updateItem(item.id, { topicId: t.id })}
                                    className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-medium px-2 py-1 sm:px-2.5 sm:py-1.5 bg-slate-800 hover:bg-violet-500 text-slate-300 hover:text-white rounded-lg transition-colors"
                                  >
                                    {t.title} <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 opacity-50" />
                                  </button>
                                ))}
                                {topics.length > suggestedTopics.length && (
                                  <select
                                    className="bg-transparent border border-slate-700 text-[10px] sm:text-xs font-medium text-slate-400 rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 outline-none focus:border-violet-500"
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
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 px-1">Pinned</h4>
                        {renderMasonry(pinnedItems)}
                      </div>
                    )}
                    {otherItems.length > 0 && (
                      <div>
                        {pinnedItems.length > 0 && <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 mt-6 px-1">Others</h4>}
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
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-violet-500/10 animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-5 border-b border-slate-800/60">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse" />
                  Link Saved Instantly
                </span>
                <button onClick={closeShareModal} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-full transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-start gap-3">
                {shareItem.imageUrl ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    <img src={shareItem.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-violet-500/20 text-violet-400 rounded-xl shrink-0 mt-1">
                    <Link2 className="h-5 w-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-start justify-between gap-4">
                    {isEditingDetails ? (
                      <div className="w-full space-y-2">
                        <input
                          type="text"
                          className="w-full et-input rounded-md px-2 py-1 text-sm"
                          value={shareItem.title || ""}
                          onChange={(e) => {
                            setShareItem({ ...shareItem, title: e.target.value });
                            updateItem(shareItem.id, { title: e.target.value });
                          }}
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          className="w-full et-input rounded-md px-2 py-1 text-sm"
                          value={shareItem.imageUrl || ""}
                          onChange={(e) => {
                            setShareItem({ ...shareItem, imageUrl: e.target.value });
                            updateItem(shareItem.id, { imageUrl: e.target.value });
                          }}
                          placeholder="Image URL"
                        />
                        <button onClick={() => setIsEditingDetails(false)} className="text-xs text-violet-400 font-medium">Done Editing</button>
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

            <div className="p-5 space-y-5 bg-slate-900/50">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 block">Quick File To Topic</label>
                <div className="flex flex-wrap gap-2 items-center">
                  <button
                    onClick={() => {
                      updateItem(shareItem.id, { topicId: undefined });
                      closeShareModal();
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-700"
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 rounded-lg text-sm font-medium transition-colors border border-violet-500/20"
                    >
                      <Folder className="h-3.5 w-3.5" />
                      {t.title}
                    </button>
                  ))}
                  {topics.length > getSuggestedTopics(shareItem.title, shareItem.content).length && (
                    <select
                      className="bg-slate-800 border border-slate-700 text-sm font-medium text-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-violet-500"
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
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Content / Notes</label>
                  <CopyButton text={shareItem.content || ""} />
                </div>
                <textarea
                  placeholder="Content or notes..."
                  className="w-full h-24 et-input rounded-xl p-3 text-sm resize-none"
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
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Extracted Text (OCR)</label>
                  <CopyButton text={shareItem.ocrText || ""} />
                </div>
                <textarea
                  placeholder="Paste or extract any text from image..."
                  className="w-full h-16 et-input rounded-xl p-3 text-sm resize-none"
                  value={shareItem.ocrText || ""}
                  onChange={(e) => {
                    setShareItem({ ...shareItem, ocrText: e.target.value });
                    updateItem(shareItem.id, { ocrText: e.target.value });
                  }}
                />
              </div>

              <button onClick={closeShareModal} className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-medium shadow-lg shadow-violet-500/20 transition-all">
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
          <div className="h-8 w-48 bg-slate-900 rounded-xl mb-2" />
          <div className="h-4 w-32 bg-slate-900 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-slate-900 rounded-xl" />
          <div className="h-9 w-9 bg-slate-900 rounded-xl" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <div className="h-12 w-full bg-slate-900 rounded-2xl" />

      {/* Tab Switcher Skeleton */}
      <div className="h-10 w-full bg-slate-900 rounded-xl" />

      {/* Grid items skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-900" />
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
