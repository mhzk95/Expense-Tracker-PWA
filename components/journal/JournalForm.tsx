"use client";

import { useState } from "react";
import { useJournal } from "@/hooks/useJournal";
import { useTransactions } from "@/hooks/useTransactions";
import { X, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

interface JournalFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function JournalForm({ onSuccess, onCancel }: JournalFormProps) {
  const { addEntry } = useJournal();
  const { transactions } = useTransactions();
  
  const [content, setContent] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [linkedTransactionId, setLinkedTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoUrls([...photoUrls, base64]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await addEntry({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        content,
        tags,
        photoUrls,
        linkedTransactionId: linkedTransactionId || undefined,
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none"
          placeholder="What's on your mind? e.g., Had an amazing dinner at Mario's today!"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Tags (press space to add)</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 text-xs">
              #{tag}
              <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleAddTag}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="Add #tags..."
        />
      </div>

      {photoUrls.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-2">
          {photoUrls.map((url, idx) => (
            <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-slate-700">
              <img src={url} alt="Upload preview" className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => setPhotoUrls(photoUrls.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white hover:bg-red-500/80"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 pt-2">
        <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer hover:text-white transition-colors">
          <div className="p-2 bg-slate-800 rounded-lg">
            <ImageIcon className="w-4 h-4" />
          </div>
          <span>Add Photo</span>
          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
        </label>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-2">
          <LinkIcon className="w-3 h-3" />
          Link to a Transaction (Optional)
        </label>
        <select
          value={linkedTransactionId}
          onChange={(e) => setLinkedTransactionId(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-violet-500 focus:outline-none appearance-none"
        >
          <option value="">No linked transaction</option>
          {transactions.map((txn) => (
            <option key={txn.id} value={txn.id}>
              {new Date(txn.date).toLocaleDateString()} - {txn.description} ({txn.amount})
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-3 pt-4 border-t border-slate-800/60">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 text-slate-300 font-medium rounded-xl hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Entry"}
        </button>
      </div>
    </form>
  );
}
