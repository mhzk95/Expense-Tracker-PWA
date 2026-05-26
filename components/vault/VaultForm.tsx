"use client";

import { useState } from "react";
import { useVault } from "@/hooks/useVault";

interface VaultFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function VaultForm({ onSuccess, onCancel }: VaultFormProps) {
  const { addEntry } = useVault();
  
  const [title, setTitle] = useState("");
  const [secretContent, setSecretContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !secretContent.trim()) return;

    setIsSubmitting(true);
    try {
      await addEntry(title, secretContent);
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
        <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none"
          placeholder="e.g., Netflix Password, Bank PIN"
          required
        />
        <p className="text-[10px] text-slate-500 mt-1">Title is visible without PIN.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">Secret Content</label>
        <textarea
          value={secretContent}
          onChange={(e) => setSecretContent(e.target.value)}
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-violet-500 focus:outline-none resize-none font-mono text-sm"
          placeholder="Enter the private details to encrypt..."
          required
        />
        <p className="text-[10px] text-slate-500 mt-1">This will be encrypted on your device using AES-GCM before saving.</p>
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
          disabled={isSubmitting || !title.trim() || !secretContent.trim()}
          className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl py-3 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Encrypting..." : "Save Securely"}
        </button>
      </div>
    </form>
  );
}
