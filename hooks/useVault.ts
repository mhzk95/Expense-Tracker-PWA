"use client";

import { useState, useEffect, useCallback } from "react";
import { VaultEntity } from "@/lib/db/indexeddb";
import { vaultRepository } from "@/lib/db/vaultRepository";
import { deriveKeyFromPin, generateSalt, encryptData, decryptData } from "@/lib/utils/crypto";

let globalCryptoKey: CryptoKey | null = null;
let globalIsUnlocked = false;

export function useVault() {
  const [entries, setEntries] = useState<VaultEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(globalIsUnlocked);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(globalCryptoKey);
  const [hasSetupPin, setHasSetupPin] = useState(false);
  const [hasBiometricsSetup, setHasBiometricsSetup] = useState(false);

  // Check if a salt exists to determine if PIN is set up
  useEffect(() => {
    const salt = localStorage.getItem("et_vault_salt");
    setHasSetupPin(!!salt);
    const bioKey = localStorage.getItem("et_vault_biometric_key");
    setHasBiometricsSetup(!!bioKey);
  }, []);

  const fetchEntries = useCallback(async () => {
    try {
      const data = await vaultRepository.getAll();
      setEntries(data);
    } catch (error) {
      console.error("Failed to fetch vault entries", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    
    const handleDbChange = () => fetchEntries();
    window.addEventListener("db:vault:changed", handleDbChange);
    window.addEventListener("sync:updated", handleDbChange);

    return () => {
      window.removeEventListener("db:vault:changed", handleDbChange);
      window.removeEventListener("sync:updated", handleDbChange);
    };
  }, [fetchEntries]);

  // Decrypts an entry's content
  const readEntry = async (entry: VaultEntity): Promise<string> => {
    if (!cryptoKey) throw new Error("Vault is locked");
    return await decryptData(entry.ciphertext, entry.iv, cryptoKey);
  };

  // Setup a new PIN for the first time
  const setupPin = async (pin: string) => {
    if (hasSetupPin) throw new Error("PIN already setup. You cannot change it without losing data currently.");
    const salt = generateSalt();
    localStorage.setItem("et_vault_salt", salt);
    
    // Test that a key can be derived (which also validates the PIN logic)
    const key = await deriveKeyFromPin(pin, salt);
    
    // Create a verification entry so we can test the PIN later
    const { ciphertext, iv } = await encryptData("VAULT_VERIFIED", key);
    localStorage.setItem("et_vault_verify_cipher", ciphertext);
    localStorage.setItem("et_vault_verify_iv", iv);

    globalCryptoKey = key;
    globalIsUnlocked = true;
    setCryptoKey(key);
    setIsUnlocked(true);
    setHasSetupPin(true);
  };

  // Unlock the vault using the PIN
  const unlock = async (pin: string): Promise<boolean> => {
    const salt = localStorage.getItem("et_vault_salt");
    const verifyCipher = localStorage.getItem("et_vault_verify_cipher");
    const verifyIv = localStorage.getItem("et_vault_verify_iv");

    if (!salt || !verifyCipher || !verifyIv) {
      throw new Error("Vault is not configured correctly. Please clear data and try again.");
    }

    try {
      const key = await deriveKeyFromPin(pin, salt);
      // Attempt to decrypt the verification payload
      const decrypted = await decryptData(verifyCipher, verifyIv, key);
      
      if (decrypted === "VAULT_VERIFIED") {
        globalCryptoKey = key;
        globalIsUnlocked = true;
        setCryptoKey(key);
        setIsUnlocked(true);
        return true;
      }
      return false;
    } catch (e) {
      return false; // Decryption failed = wrong PIN
    }
  };

  const lock = () => {
    globalCryptoKey = null;
    globalIsUnlocked = false;
    setCryptoKey(null);
    setIsUnlocked(false);
  };

  const setupBiometrics = async () => {
    if (!window.PublicKeyCredential) throw new Error("Biometrics not supported");
    
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "Expense Tracker Vault", id: window.location.hostname },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: "local-user",
          displayName: "Vault User"
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required"
        },
        timeout: 60000
      }
    });

    if (credential) {
       const generatedPin = crypto.randomUUID() + crypto.randomUUID();
       localStorage.setItem("et_vault_biometric_key", generatedPin);
       await setupPin(generatedPin);
       setHasBiometricsSetup(true);
       return true;
    }
    return false;
  };

  const unlockWithBiometrics = async () => {
    if (!window.PublicKeyCredential) throw new Error("Biometrics not supported");
    
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rpId: window.location.hostname,
        userVerification: "required",
        timeout: 60000
      }
    });

    if (assertion) {
       const key = localStorage.getItem("et_vault_biometric_key");
       if (key) {
         return await unlock(key);
       }
    }
    return false;
  };

  const addEntry = async (title: string, secretContent: string) => {
    if (!cryptoKey) throw new Error("Vault is locked");
    const { ciphertext, iv } = await encryptData(secretContent, cryptoKey);
    
    await vaultRepository.add({
      id: crypto.randomUUID(),
      title,
      ciphertext,
      iv,
    });
  };

  const updateEntry = async (id: string, title: string, secretContent: string) => {
    if (!cryptoKey) throw new Error("Vault is locked");
    const { ciphertext, iv } = await encryptData(secretContent, cryptoKey);
    
    await vaultRepository.update(id, {
      title,
      ciphertext,
      iv,
    });
  };

  const deleteEntry = async (id: string) => {
    await vaultRepository.softDelete(id);
  };

  return {
    entries,
    loading,
    isUnlocked,
    hasSetupPin,
    setupPin,
    unlock,
    setupBiometrics,
    unlockWithBiometrics,
    hasBiometricsSetup,
    lock,
    readEntry,
    addEntry,
    updateEntry,
    deleteEntry,
  };
}
