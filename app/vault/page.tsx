"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useVault } from "@/hooks/useVault";
import { Lock, Unlock, Plus, Shield, ShieldCheck, ShieldAlert, KeyRound, Eye } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { VaultForm } from "@/components/vault/VaultForm";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { formatDate } from "@/lib/utils/helpers";
import { VaultEntity } from "@/lib/db/indexeddb";

export default function VaultPage() {
  const { entries, loading, isUnlocked, hasBiometricsSetup, setupBiometrics, unlockWithBiometrics, lock, readEntry, deleteEntry } = useVault();
  
  const [pinError, setPinError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<{title: string, text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleBiometricAction = async () => {
    setPinError("");
    setIsProcessing(true);
    try {
      if (!hasBiometricsSetup) {
        const ok = await setupBiometrics();
        if (!ok) setPinError("Biometric setup was cancelled or failed.");
      } else {
        const ok = await unlockWithBiometrics();
        if (!ok) setPinError("Failed to unlock.");
      }
    } catch (err: any) {
      setPinError(err.message || "Biometric error.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRead = async (entry: VaultEntity) => {
    try {
      const decrypted = await readEntry(entry);
      setViewingEntry({ title: entry.title, text: decrypted });
    } catch (e) {
      alert("Failed to decrypt entry.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading vault...</div>;
  }

  return (
    <div className="space-y-6 pb-20">
      <PageHeader
        title="Secure Vault"
        subtitle={isUnlocked ? "Unlocked" : "Locked (E2E Encrypted)"}
        action={
          isUnlocked ? (
            <div className="flex gap-2">
              <button
                onClick={() => lock()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                <Lock className="h-4 w-4" />
                Lock
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
              >
                <Plus className="h-4 w-4" />
                Add Secret
              </button>
            </div>
          ) : undefined
        }
      />

      {!isUnlocked ? (
        <div className="max-w-md mx-auto pt-10">
          <div className="bg-slate-900/60 border border-slate-800/60 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {hasBiometricsSetup ? <Lock className="w-10 h-10 text-violet-400" /> : <ShieldAlert className="w-10 h-10 text-emerald-400" />}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {hasBiometricsSetup ? "Unlock Vault" : "Setup Biometric Vault"}
            </h2>
            <p className="text-sm text-slate-400 mb-8">
              {hasBiometricsSetup 
                ? "Use FaceID / TouchID to decrypt your secure notes." 
                : "Register your device's biometrics (FaceID/TouchID) to seamlessly encrypt and secure your vault."}
            </p>

            <div className="space-y-4">
              {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
              
              <button
                onClick={handleBiometricAction}
                disabled={isProcessing}
                className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl py-4 transition-colors disabled:opacity-50"
              >
                {isProcessing ? "Authenticating..." : hasBiometricsSetup ? "Unlock with Biometrics" : "Enable Biometrics"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p>Vault is unlocked. Data is temporarily decrypted in memory.</p>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-slate-800/40 border-dashed">
              <div className="w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">Vault is empty</h3>
              <p className="text-slate-400 text-sm">Add your first password or secure note.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <SwipeToDelete key={entry.id} onDelete={() => deleteEntry(entry.id)}>
                  <div className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-4 flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-white font-medium text-left">{entry.title}</h3>
                      <p className="text-xs text-slate-500 text-left mt-1">Saved {formatDate(entry.createdAt, "short")}</p>
                    </div>
                    <button
                      onClick={() => handleRead(entry)}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-violet-400 rounded-xl transition-colors"
                      title="Reveal secret"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </SwipeToDelete>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Entry Modal */}
      <AdaptiveOverlay isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Secure Note">
        <VaultForm onSuccess={() => setIsFormOpen(false)} onCancel={() => setIsFormOpen(false)} />
      </AdaptiveOverlay>

      {/* Read Entry Modal */}
      <AdaptiveOverlay isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title={viewingEntry?.title || "Secret"}>
        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <pre className="text-white font-mono text-sm whitespace-pre-wrap font-sans leading-relaxed">{viewingEntry?.text}</pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(viewingEntry?.text || "");
              alert("Copied to clipboard");
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl py-3 transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      </AdaptiveOverlay>
    </div>
  );
}
