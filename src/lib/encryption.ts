/**
 * End-to-End Encryption utilities using Web Crypto API
 * Implements AES-GCM for message encryption with RSA-OAEP for key exchange
 */

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

// Encryption key storage prefix
const STORAGE_PREFIX = 'e2e_';

/**
 * Generate a new encryption key pair for a user
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export public key to base64 string for storage
 */
export async function exportPublicKey(publicKey: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', publicKey);
  return arrayBufferToBase64(exported);
}

/**
 * Import public key from base64 string
 */
export async function importPublicKey(publicKeyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(publicKeyString);
  return await crypto.subtle.importKey(
    'spki',
    keyData,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Export private key to encrypted storage
 */
export async function exportPrivateKey(privateKey: CryptoKey, password: string): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', privateKey);
  const encrypted = await encryptWithPassword(exported, password);
  return arrayBufferToBase64(encrypted);
}

/**
 * Import private key from encrypted storage
 */
export async function importPrivateKey(
  encryptedKeyString: string,
  password: string
): Promise<CryptoKey> {
  const encryptedKey = base64ToArrayBuffer(encryptedKeyString);
  const decrypted = await decryptWithPassword(encryptedKey, password);
  
  return await crypto.subtle.importKey(
    'pkcs8',
    decrypted,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['decrypt']
  );
}

/**
 * Generate a symmetric key for encrypting room messages
 */
export async function generateRoomKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    {
      name: ENCRYPTION_ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Export room key to raw format
 */
export async function exportRoomKey(roomKey: CryptoKey): Promise<ArrayBuffer> {
  return await crypto.subtle.exportKey('raw', roomKey);
}

/**
 * Import room key from raw format
 */
export async function importRoomKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: ENCRYPTION_ALGORITHM,
      length: KEY_LENGTH,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a message with a room key
 */
export async function encryptMessage(message: string, roomKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encodedMessage = new TextEncoder().encode(message);

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    roomKey,
    encodedMessage
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return arrayBufferToBase64(combined.buffer);
}

/**
 * Decrypt a message with a room key
 */
export async function decryptMessage(encryptedMessage: string, roomKey: CryptoKey): Promise<string> {
  try {
    const combined = base64ToArrayBuffer(encryptedMessage);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encryptedData = combined.slice(IV_LENGTH);

    const decryptedData = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      roomKey,
      encryptedData
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Encrypted message - unable to decrypt]';
  }
}

/**
 * Encrypt room key with user's public key
 */
export async function encryptRoomKey(
  roomKey: CryptoKey,
  publicKey: CryptoKey
): Promise<string> {
  const exportedRoomKey = await exportRoomKey(roomKey);
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    publicKey,
    exportedRoomKey
  );

  return arrayBufferToBase64(encryptedKey);
}

/**
 * Decrypt room key with user's private key
 */
export async function decryptRoomKey(
  encryptedRoomKey: string,
  privateKey: CryptoKey
): Promise<CryptoKey> {
  const encryptedKeyData = base64ToArrayBuffer(encryptedRoomKey);
  const decryptedKeyData = await crypto.subtle.decrypt(
    {
      name: 'RSA-OAEP',
    },
    privateKey,
    encryptedKeyData
  );

  return await importRoomKey(decryptedKeyData);
}

/**
 * Encrypt data with password (for private key storage)
 */
async function encryptWithPassword(data: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const passwordKey = await deriveKeyFromPassword(password);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    passwordKey,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);

  return combined.buffer;
}

/**
 * Decrypt data with password
 */
async function decryptWithPassword(encryptedData: ArrayBuffer, password: string): Promise<ArrayBuffer> {
  const passwordKey = await deriveKeyFromPassword(password);
  
  // Extract IV and encrypted data
  const combined = new Uint8Array(encryptedData);
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);

  return await crypto.subtle.decrypt(
    {
      name: ENCRYPTION_ALGORITHM,
      iv: iv,
    },
    passwordKey,
    data
  );
}

/**
 * Derive encryption key from password
 */
async function deriveKeyFromPassword(password: string): Promise<CryptoKey> {
  const passwordBuffer = new TextEncoder().encode(password);
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new TextEncoder().encode('supportcircle-salt-v1'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  );
}

/**
 * Store user's key pair in localStorage
 */
export function storeKeyPair(
  userId: string,
  publicKey: string,
  encryptedPrivateKey: string
): void {
  localStorage.setItem(`${STORAGE_PREFIX}public_${userId}`, publicKey);
  localStorage.setItem(`${STORAGE_PREFIX}private_${userId}`, encryptedPrivateKey);
}

/**
 * Retrieve user's public key from localStorage
 */
export function getStoredPublicKey(userId: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}public_${userId}`);
}

/**
 * Retrieve user's encrypted private key from localStorage
 */
export function getStoredPrivateKey(userId: string): string | null {
  return localStorage.getItem(`${STORAGE_PREFIX}private_${userId}`);
}

/**
 * Store decrypted room key in session storage (temporary)
 */
export function storeRoomKey(roomId: string, roomKey: string): void {
  sessionStorage.setItem(`${STORAGE_PREFIX}room_${roomId}`, roomKey);
}

/**
 * Retrieve room key from session storage
 */
export function getStoredRoomKey(roomId: string): string | null {
  return sessionStorage.getItem(`${STORAGE_PREFIX}room_${roomId}`);
}

/**
 * Clear all room keys from session storage
 */
export function clearRoomKeys(): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(`${STORAGE_PREFIX}room_`)) {
      sessionStorage.removeItem(key);
    }
  });
}

/**
 * Helper: Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Helper: Convert base64 string to ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Check if browser supports Web Crypto API
 */
export function isEncryptionSupported(): boolean {
  return !!(crypto && crypto.subtle);
}
