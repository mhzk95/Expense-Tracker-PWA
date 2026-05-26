"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { formatCurrency, formatDate } from "@/lib/utils/helpers";
import { Plus, Image as ImageIcon, Link as LinkIcon, Trash2, X } from "lucide-react";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { JournalForm } from "@/components/journal/JournalForm";

export default function JournalPage() {
  const { entries, loading, deleteEntry } = useJournal();
  const { transactions } = useTransactions();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags)));

  // Filter entries
  const filteredEntries = entries.filter(e => {
    if (selectedTag && !e.tags.includes(selectedTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const qTag = q.replace(/^#/, ''); // Remove # if user typed it
      if (!e.content.toLowerCase().includes(q) && !e.tags.some(t => t.toLowerCase().includes(qTag))) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Journal"
        subtitle={loading ? "Loading..." : `${entries.length} entries`}
        action={
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
          >
            <Plus className="h-4 w-4" />
            Add Entry
          </button>
        }
      />

      <div className="flex flex-col gap-4">
        {/* Search & Tags */}
        <div className="space-y-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search journal..."
            className="w-full bg-slate-900/60 border border-slate-800/60 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          />
          
          {allTags.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedTag(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedTag === null ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedTag === tag ? "bg-violet-600 text-white" : "bg-slate-800/60 text-slate-400 hover:text-white"
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Feed */}
        {loading ? (
          <div className="text-center text-slate-500 py-10">Loading entries...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/40 border-dashed">
            <div className="w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-1">No memories found</h3>
            <p className="text-slate-400 text-sm">Write your first journal entry to start saving memories.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map(entry => {
              const linkedTxn = entry.linkedTransactionId ? transactions.find(t => t.id === entry.linkedTransactionId) : null;
              
              return (
                <SwipeToDelete key={entry.id} onDelete={() => deleteEntry(entry.id)}>
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl overflow-hidden w-full">
                    {/* Photos */}
                    {entry.photoUrls.length > 0 && (
                      <div 
                        className="w-full aspect-[4/3] bg-black cursor-pointer"
                        onClick={() => setLightboxImage(entry.photoUrls[0])}
                      >
                        <img src={entry.photoUrls[0]} alt="Journal attachment" className="w-full h-full object-cover" />
                      </div>
                    )}
                    
                    <div className="p-5">
                      <p className="text-xs text-slate-500 mb-3">{formatDate(entry.date, "long")}</p>
                      
                      <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                      
                      {entry.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {entry.tags.map(tag => (
                            <span key={tag} className="text-xs font-medium text-violet-400">#{tag}</span>
                          ))}
                        </div>
                      )}

                      {linkedTxn && (
                        <div className="mt-5 p-3 bg-slate-950/50 rounded-xl border border-slate-800/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">{linkedTxn.description}</span>
                          </div>
                          <span className="text-xs font-bold text-white">
                            {formatCurrency(linkedTxn.amount, linkedTxn.currency)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </SwipeToDelete>
              );
            })}
          </div>
        )}
      </div>

      <AdaptiveOverlay isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="New Journal Entry">
        <JournalForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
      </AdaptiveOverlay>

      {/* Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <button className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src={lightboxImage} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
