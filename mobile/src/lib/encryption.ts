import AsyncStorage from '@react-native-async-storage/async-storage';

// Web Crypto API is available in React Native via polyfills
const crypto = globalThis.crypto;

// Helper functions for base64 encoding/decoding without Buffer
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function generateKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );
  return keyPair as { publicKey: CryptoKey; privateKey: CryptoKey };
}

export async function exportPublicKey(key: CryptoKey): Promise<string> {
  const exported = await crypto.subtle.exportKey('spki', key);
  return arrayBufferToBase64(exported);
}

export async function exportPrivateKey(key: CryptoKey, password: string): Promise<string> {
  const exported = await crypto.subtle.exportKey('pkcs8', key);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const wrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['wrapKey', 'unwrapKey']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const wrappedKey = await crypto.subtle.wrapKey('pkcs8', key, wrappingKey, {
    name: 'AES-GCM',
    iv,
  });

  const result = new Uint8Array(salt.length + iv.length + wrappedKey.byteLength);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(wrappedKey), salt.length + iv.length);

  return arrayBufferToBase64(result.buffer);
}

export async function importPrivateKey(encryptedKey: string, password: string): Promise<CryptoKey> {
  const data = base64ToArrayBuffer(encryptedKey);
  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const wrappedKey = data.slice(28);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  const unwrappingKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['wrapKey', 'unwrapKey']
  );

  return await crypto.subtle.unwrapKey(
    'pkcs8',
    wrappedKey,
    unwrappingKey,
    { name: 'AES-GCM', iv },
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
}

export async function encryptMessage(message: string, roomKey: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(message);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    roomKey,
    encoded
  );

  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);

  return arrayBufferToBase64(result.buffer);
}

export async function decryptMessage(encryptedMessage: string, roomKey: CryptoKey): Promise<string> {
  const data = base64ToArrayBuffer(encryptedMessage);
  const iv = data.slice(0, 12);
  const encrypted = data.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    roomKey,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

export async function generateRoomKey(): Promise<CryptoKey> {
  return await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function encryptRoomKey(roomKey: CryptoKey, publicKey: string): Promise<string> {
  const keyData = await crypto.subtle.exportKey('raw', roomKey);
  const publicKeyData = base64ToArrayBuffer(publicKey);
  
  const importedPublicKey = await crypto.subtle.importKey(
    'spki',
    new Uint8Array(publicKeyData),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    importedPublicKey,
    keyData
  );

  return arrayBufferToBase64(encrypted);
}

export async function decryptRoomKey(
  encryptedRoomKey: string,
  encryptedPrivateKey: string,
  password: string
): Promise<CryptoKey> {
  const privateKey = await importPrivateKey(encryptedPrivateKey, password);
  const encryptedData = base64ToArrayBuffer(encryptedRoomKey);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    new Uint8Array(encryptedData)
  );

  return await crypto.subtle.importKey(
    'raw',
    decrypted,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
}

export async function storeKeyPair(userId: string, publicKey: string, encryptedPrivateKey: string) {
  await AsyncStorage.setItem(
    `encryption_keys_${userId}`,
    JSON.stringify({ publicKey, encryptedPrivateKey })
  );
}

export async function getStoredKeys(userId: string): Promise<{ publicKey: string; encryptedPrivateKey: string } | null> {
  try {
    const stored = await AsyncStorage.getItem(`encryption_keys_${userId}`);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
