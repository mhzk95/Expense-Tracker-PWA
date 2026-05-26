/**
 * Cryptography utilities for the Secure Vault using Web Crypto API.
 */

const ITERATIONS = 600_000; // High iteration count to protect 6-digit PINs against brute force

// Convert string to ArrayBuffer
function getMessageEncoding(message: string) {
  const enc = new TextEncoder();
  return enc.encode(message);
}

// Convert ArrayBuffer to string
function getMessageDecoding(buffer: ArrayBuffer) {
  const dec = new TextDecoder();
  return dec.decode(buffer);
}

// Convert ArrayBuffer to Base64 string for easy storage
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string back to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives an AES-GCM CryptoKey from a string PIN and a Salt.
 */
export async function deriveKeyFromPin(pin: string, saltBase64: string): Promise<CryptoKey> {
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    getMessageEncoding(pin),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  const saltBuffer = base64ToBuffer(saltBase64);

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // The key itself is not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates a random salt and returns it as a Base64 string.
 */
export function generateSalt(): string {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt.buffer);
}

/**
 * Encrypts a string using the provided AES-GCM key.
 * Returns the ciphertext and the Initialization Vector (IV), both as Base64.
 */
export async function encryptData(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = getMessageEncoding(plaintext);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encoded
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypts data using the provided AES-GCM key and IV.
 */
export async function decryptData(ciphertextBase64: string, ivBase64: string, key: CryptoKey): Promise<string> {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivBuffer,
      },
      key,
      ciphertextBuffer
    );

    return getMessageDecoding(decryptedBuffer);
  } catch (err) {
    throw new Error("Decryption failed. Incorrect PIN or corrupted data.");
  }
}
