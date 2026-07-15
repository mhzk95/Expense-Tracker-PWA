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
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-black uppercase tracking-widest text-[var(--color-text)] bg-gray-100 hover:bg-gray-200 border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:translate-x-1 active:translate-y-1"
              >
                <Lock className="h-4 w-4 stroke-[3px]" />
                Lock
              </button>
              <button
                onClick={() => setIsFormOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-black uppercase tracking-widest text-white bg-[var(--color-primary)] hover:bg-violet-500 border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:translate-x-1 active:translate-y-1"
              >
                <Plus className="h-4 w-4 stroke-[3px]" />
                Add Secret
              </button>
            </div>
          ) : undefined
        }
      />

      {!isUnlocked ? (
        <div className="max-w-md mx-auto pt-10">
          <div className="bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-8 text-center relative">
            <div className="w-20 h-20 bg-[var(--color-primary-glow)] border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] rounded-[12px] flex items-center justify-center mx-auto mb-6">
              {(hasBiometricsSetup || hasManualPin) ? <Lock className="w-10 h-10 text-[var(--color-primary)] stroke-[2.5px]" /> : <ShieldAlert className="w-10 h-10 text-emerald-500 stroke-[2.5px]" />}
            </div>
            
            <h2 className="text-xl font-black text-[var(--color-text)] uppercase tracking-widest mb-2">
              {!hasSetupPin ? "Setup Vault" : "Unlock Vault"}
            </h2>
            
            {!hasSetupPin ? (
              <p className="text-sm font-bold text-gray-500 mb-8">
                Choose how you want to secure your vault. You can enable the other method later.
              </p>
            ) : (
              <p className="text-sm font-bold text-gray-500 mb-8">
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
                    className="w-full bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none text-white font-black uppercase tracking-widest text-sm rounded-[12px] py-4 border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] transition-all disabled:opacity-50"
                  >
                    {isProcessing ? "Authenticating..." : "Setup Biometrics"}
                  </button>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-[var(--color-border)]"></div></div>
                    <div className="relative flex justify-center text-xs font-black uppercase tracking-widest"><span className="bg-[var(--color-surface)] px-3 text-[var(--color-text)]">Or use PIN</span></div>
                  </div>
                  <form onSubmit={handlePinAction} className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="password"
                      value={pinInput}
                      onChange={e => setPinInput(e.target.value)}
                      placeholder="Enter a secure PIN"
                      className="flex-1 min-w-0 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-4 py-3 font-bold text-[var(--color-text)] focus:outline-none focus:shadow-[2px_2px_0px_0px_var(--color-primary)] placeholder:text-gray-400"
                      required
                    />
                    <button type="submit" disabled={isProcessing || !pinInput} className="bg-black hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none text-white py-3 sm:px-6 rounded-[12px] font-black uppercase tracking-widest text-xs border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] transition-all">
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
                      className="w-full bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none text-white font-black uppercase tracking-widest text-sm rounded-[12px] py-4 border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] transition-all disabled:opacity-50"
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
                        className="flex-1 min-w-0 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] px-4 py-3 text-center tracking-[0.3em] font-mono font-bold text-lg text-[var(--color-text)] focus:outline-none focus:shadow-[2px_2px_0px_0px_var(--color-primary)] placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-base"
                        required
                        autoFocus
                      />
                      <button type="submit" disabled={isProcessing || !pinInput} className="bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none text-white py-3 sm:px-6 rounded-[12px] font-black uppercase tracking-widest text-xs border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] transition-all">
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
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border-2 border-emerald-500 shadow-[4px_4px_0px_0px_#10b981] rounded-[16px] text-emerald-700 text-xs font-black uppercase tracking-widest">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 stroke-[2.5px]" />
            <p>Vault is unlocked. Data is temporarily decrypted in memory.</p>
          </div>

          {entries.length === 0 ? (
            <div className="text-center py-16 px-4 border-[3px] border-dashed border-[var(--color-border)] bg-[var(--color-surface)] rounded-[16px]">
              <div className="w-16 h-16 bg-gray-100 border-2 border-[var(--color-border)] rounded-[12px] flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-8 h-8 text-[var(--color-text)] stroke-[2.5px]" />
              </div>
              <h3 className="text-[var(--color-text)] font-black uppercase tracking-widest text-lg mb-1">Vault is empty</h3>
              <p className="text-gray-500 font-bold text-sm">Add your first password or secure note.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map(entry => (
                <SwipeToDelete 
                  key={entry.id} 
                  onDelete={() => deleteEntry(entry.id)}
                  deleteMessage={`Delete "${entry.title}"?`}
                >
                  <div className="bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] px-5 py-4 flex items-center justify-between w-full">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-text)] text-left">{entry.title}</h3>
                      <p className="text-[10px] font-bold text-gray-500 text-left mt-0.5">Saved {formatDate(entry.createdAt, "medium")}</p>
                    </div>
                    <button
                      onClick={() => handleRead(entry)}
                      className="p-2.5 bg-[var(--color-surface)] hover:bg-[var(--color-primary)] hover:text-white border-2 border-[var(--color-border)] rounded-[10px] shadow-[2px_2px_0px_0px_var(--color-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all active:translate-x-1 active:translate-y-1 text-[var(--color-text)]"
                      title="Reveal secret"
                    >
                      <Eye className="w-4 h-4 stroke-[2.5px]" />
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
          <div className="bg-gray-100 border-2 border-[var(--color-border)] shadow-[inset_0px_2px_4px_rgba(0,0,0,0.05)] rounded-[12px] p-4 overflow-x-auto">
            <pre className="text-[var(--color-text)] font-mono font-bold text-sm whitespace-pre-wrap leading-relaxed">{viewingEntry?.text}</pre>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(viewingEntry?.text || "");
              alert("Copied to clipboard");
            }}
            className="w-full bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-1 active:translate-y-1 active:shadow-none text-white font-black uppercase tracking-widest text-sm rounded-[12px] py-4 border-2 border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] transition-all"
          >
            Copy to Clipboard
          </button>
        </div>
      </AdaptiveOverlay>
    </div>
  );
}
