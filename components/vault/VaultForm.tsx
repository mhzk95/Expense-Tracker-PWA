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
        <label className="block text-xs font-black text-[var(--color-text)] uppercase tracking-widest mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-4 py-3 font-bold text-[var(--color-text)] focus:outline-none focus:shadow-[2px_2px_0px_0px_var(--color-primary)] placeholder:text-gray-400"
          placeholder="e.g., Netflix Password, Bank PIN"
          required
        />
        <p className="text-[10px] font-bold text-gray-500 mt-1">Title is visible without PIN.</p>
      </div>

      <div>
        <label className="block text-xs font-black text-[var(--color-text)] uppercase tracking-widest mb-1">Secret Content</label>
        <textarea
          value={secretContent}
          onChange={(e) => setSecretContent(e.target.value)}
          rows={5}
          className="w-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-4 py-3 resize-none font-mono font-bold text-sm text-[var(--color-text)] focus:outline-none focus:shadow-[2px_2px_0px_0px_var(--color-primary)] placeholder:text-gray-400"
          placeholder="Enter the private details to encrypt..."
          required
        />
        <p className="text-[10px] font-bold text-gray-500 mt-1">This will be encrypted on your device using AES-GCM before saving.</p>
      </div>

      <div className="flex gap-3 pt-4 border-t-2 border-[var(--color-border)]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 text-[var(--color-text)] font-black uppercase tracking-widest text-xs bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[12px]  hover:bg-[var(--color-surfaceHover)] hover:translate-x-0.5 hover:translate-y-0.5 hover: active:translate-x-1 active:translate-y-1 active:shadow-none transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !title.trim() || !secretContent.trim()}
          className="flex-1 bg-emerald-400 hover:bg-emerald-300 text-[var(--color-text)] font-black uppercase tracking-widest text-xs border-2 border-[var(--color-border)] rounded-[12px]  hover:translate-x-0.5 hover:translate-y-0.5 hover: active:translate-x-1 active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 py-3"
        >
          {isSubmitting ? "Encrypting..." : "Save Securely"}
        </button>
      </div>
    </form>
  );
}
