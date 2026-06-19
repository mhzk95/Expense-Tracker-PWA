"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { useVault } from "@/hooks/useVault";
import { Lock, Unlock, Plus, Shield, ShieldCheck, ShieldAlert, KeyRound, Eye } from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { VaultForm } from "@/components/vault/VaultForm";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { formatDate } from "@/lib/utils/helpers";
import { VaultEntity } from "@/lib/db/indexeddb";

export default function VaultPage() {
  const { entries, loading, isUnlocked, hasSetupPin, hasManualPin, setupPin, changePin, unlock, hasBiometricsSetup, setupBiometrics, unlockWithBiometrics, lock, readEntry, deleteEntry, resetVault } = useVault();
  
  const [pinError, setPinError] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingEntry, setViewingEntry] = useState<{title: string, text: string} | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [pinInput, setPinInput] = useState("");
  // Determine default tab based on what's set up
  const [activeTab, setActiveTab] = useState<"biometric" | "pin">("biometric");

  // Sync activeTab when the vault state loads from localStorage
  useEffect(() => {
    if (hasBiometricsSetup) {
      setActiveTab("biometric");
    } else if (hasManualPin) {
      setActiveTab("pin");
    }
  }, [hasBiometricsSetup, hasManualPin]);

  const handleBiometricAction = async () => {
    setPinError("");
    setIsProcessing(true);
    try {
      if (!hasBiometricsSetup) {
        // If they already have a manual PIN, pass it so it gets reused
        const currentPin = hasManualPin && pinInput ? pinInput : undefined;
        // Wait, if they are setting up biometrics and they HAVE a manual PIN, they MUST provide it or be unlocked!
        // Actually, if they are setting up Biometrics, they just use it.
        const ok = await setupBiometrics(currentPin);
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

  const handlePinAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput) return;
    setPinError("");
    setIsProcessing(true);
    try {
      if (!hasSetupPin) {
        await setupPin(pinInput, true);
        setPinInput("");
      } else {
        const ok = await unlock(pinInput);
        if (!ok) setPinError("Invalid PIN.");
        else setPinInput("");
      }
    } catch (err: any) {
      setPinError(err.message || "PIN error.");
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
          <div className="glass-card p-8 text-center relative">
            <div className="w-20 h-20 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              {(hasBiometricsSetup || hasManualPin) ? <Lock className="w-10 h-10 text-violet-400" /> : <ShieldAlert className="w-10 h-10 text-emerald-400" />}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {!hasSetupPin ? "Setup Vault" : "Unlock Vault"}
            </h2>
            
            {!hasSetupPin ? (
              <p className="text-sm text-slate-400 mb-8">
                Choose how you want to secure your vault. You can enable the other method later.
              </p>
            ) : (
              <p className="text-sm text-slate-400 mb-8">
                {activeTab === "biometric" ? "Use FaceID / TouchID to decrypt your secure notes." : "Enter your PIN to decrypt your secure notes."}
              </p>
            )}

            <div className="space-y-4">
              {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
              
              {!hasSetupPin ? (
                // Setup Mode
                <div className="space-y-6">
                  <button
                    onClick={handleBiometricAction}
                    disabled={isProcessing}
                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl py-4 transition-colors disabled:opacity-50"
                  >
                    {isProcessing ? "Authenticating..." : "Setup Biometrics"}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900 px-2 text-slate-500">Or use PIN</span></div>
                  </div>
                  <form onSubmit={handlePinAction} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      placeholder="Enter a secure PIN"
                      className="flex-1 min-w-0 et-input rounded-xl px-4 py-3"
                      required
                    />
                    <button type="submit" disabled={isProcessing || !pinInput} className="bg-slate-800 hover:bg-slate-700 text-white py-3 sm:px-6 rounded-xl font-medium transition-colors">
                      Save
                    </button>
                  </form>
                </div>
              ) : (
                // Unlock Mode
                <>
                  {activeTab === "biometric" ? (
                    <button
                      onClick={handleBiometricAction}
                      disabled={isProcessing}
                      className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl py-4 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? "Authenticating..." : "Unlock with Biometrics"}
                    </button>
                  ) : (
                    <form onSubmit={handlePinAction} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="password"
                        value={pinInput}
                        onChange={e => setPinInput(e.target.value)}
                        placeholder="Enter your PIN"
                        className="flex-1 min-w-0 et-input rounded-xl px-4 py-3 text-center tracking-[0.3em] font-mono text-lg"
                        required
                        autoFocus
                      />
                      <button type="submit" disabled={isProcessing || !pinInput} className="bg-violet-600 hover:bg-violet-500 text-white py-3 sm:px-6 rounded-xl font-medium transition-colors">
                        Unlock
                      </button>
                    </form>
                  )}

                  <div className="flex justify-end items-center mt-6">

                    {/* Toggle / Setup Button (Bottom Right) */}
                    {!hasBiometricsSetup ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const pin = prompt("Enter your current PIN to enable biometrics:");
                          if (pin) {
                            setIsProcessing(true);
                            try {
                              const isValid = await unlock(pin);
                              if (isValid) {
                                await setupBiometrics(pin);
                                alert("Biometrics enabled successfully!");
                              } else {
                                setPinError("Invalid PIN entered for setup.");
                              }
                            } catch (e: any) {
                              setPinError(e.message || "Failed to setup biometrics");
                            } finally {
                              setIsProcessing(false);
                            }
                          }
                        }}
                        className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                      >
                        Enable Biometrics
                      </button>
                    ) : !hasManualPin ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const pin = prompt("Enter a new manual PIN:");
                          if (pin) {
                            setIsProcessing(true);
                            try {
                              // If they only have biometrics, they must authenticate first to change PIN
                              const authOk = await unlockWithBiometrics();
                              if (authOk) {
                                await changePin(pin);
                                alert("PIN enabled successfully!");
                              } else {
                                setPinError("Biometric authentication failed.");
                              }
                            } catch (e: any) {
                              setPinError(e.message || "Failed to setup PIN");
                            } finally {
                              setIsProcessing(false);
                            }
                          }
                        }}
                        className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                      >
                        Enable PIN
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab(activeTab === "biometric" ? "pin" : "biometric");
                          setPinError("");
                        }}
                        className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                      >
                        {activeTab === "biometric" ? "Use PIN instead" : "Use Biometrics instead"}
                      </button>
                    )}
                  </div>
                </>
              )}
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
            <div className="text-center py-16 px-4 glass-card !border-dashed !border-white/20">
              <div className="w-16 h-16 bg-slate-800/60 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-white font-medium text-lg mb-1">Vault is empty</h3>
              <p className="text-slate-400 text-sm">Add your first password or secure note.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <SwipeToDelete 
                  key={entry.id} 
                  onDelete={() => deleteEntry(entry.id)}
                  deleteMessage={`Delete "${entry.title}"?`}
                >
                  <div className="glass-card p-4 flex items-center justify-between w-full">
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
