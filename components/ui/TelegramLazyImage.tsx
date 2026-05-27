import { useState } from "react";
import { downloadFromTelegram, getTelegramToken } from "@/lib/services/telegram";
import { CloudDownload, Loader2 } from "lucide-react";
import { getDB } from "@/lib/db/indexeddb";

interface Props {
  url: string | Blob;
  alt: string;
  className?: string;
  onClick?: (src: string) => void;
  entryId?: string;
  photoIndex?: number;
}

export function TelegramLazyImage({ url, alt, className, onClick, entryId, photoIndex }: Props) {
  const isTelegram = typeof url === 'string' && url.startsWith("telegram:");
  const [loadedSrc, setLoadedSrc] = useState<string | null>(isTelegram ? null : (typeof url === 'string' ? url : URL.createObjectURL(url)));
  const [loading, setLoading] = useState(false);

  if (!isTelegram || loadedSrc) {
    return (
      <img 
        src={loadedSrc!} 
        alt={alt} 
        className={className} 
        onClick={() => onClick?.(loadedSrc!)}
      />
    );
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = getTelegramToken();
    if (!token) {
      alert("Telegram token missing. Please connect Telegram in settings.");
      return;
    }
    
    setLoading(true);
    const fileId = (url as string).replace("telegram:", "");
    const blob = await downloadFromTelegram(token, fileId);
    if (blob) {
      const objectUrl = URL.createObjectURL(blob);
      setLoadedSrc(objectUrl);
      
      if (entryId && photoIndex !== undefined) {
        getDB().then(async (db) => {
          const tx = db.transaction("journalEntries", "readwrite");
          const store = tx.objectStore("journalEntries");
          const entry = await store.get(entryId);
          if (entry) {
            entry.photoUrls[photoIndex] = blob;
            await store.put(entry);
          }
        }).catch(console.error);
      }
    } else {
      alert("Failed to download image from Telegram.");
    }
    setLoading(false);
  };

  return (
    <div 
      className={`relative overflow-hidden cursor-pointer group flex items-center justify-center bg-slate-900 ${className}`}
      onClick={handleDownload}
    >
      {/* Antigravity wave effect placeholder */}
      <div className="absolute inset-0 opacity-40 group-hover:opacity-70 transition-opacity">
        <div 
          className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-600 blur-2xl animate-pulse" 
          style={{ animationDuration: '3s' }} 
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-400 via-transparent to-purple-500 mix-blend-overlay opacity-50" />
      </div>
      
      <div className="relative z-10 flex flex-col items-center gap-2 text-white">
        {loading ? (
          <Loader2 className="w-8 h-8 animate-spin text-white/80" />
        ) : (
          <>
            <CloudDownload className="w-8 h-8 text-white/80 group-hover:scale-110 transition-transform" />
            <span className="text-xs font-medium text-white/90 bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 shadow-xl">
              Tap to download
            </span>
          </>
        )}
      </div>
    </div>
  );
}
