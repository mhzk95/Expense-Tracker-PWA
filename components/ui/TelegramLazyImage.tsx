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
  
  let initialSrc = null;
  if (!isTelegram) {
    if (typeof url === 'string') {
      initialSrc = url;
    } else if (url && (url instanceof Blob)) {
      initialSrc = URL.createObjectURL(url);
    }
  }

  const [loadedSrc, setLoadedSrc] = useState<string | null>(initialSrc);
  const [loading, setLoading] = useState(false);

  if (!isTelegram) {
    if (!loadedSrc) {
       // Invalid object fallback
       return <div className={`flex items-center justify-center bg-slate-800/50 border border-red-500/20 text-red-400 text-xs rounded-lg ${className}`}>Corrupted Image</div>;
    }
    return (
      <img 
        src={loadedSrc} 
        alt={alt} 
        className={className} 
        onClick={() => onClick?.(loadedSrc)}
      />
    );
  }

  if (loadedSrc) {
    return (
      <img 
        src={loadedSrc} 
        alt={alt} 
        className={className} 
        onClick={() => onClick?.(loadedSrc)}
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
