import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import * as encryption from '../lib/encryption';
import { supabase } from '../lib/supabase';

interface EncryptionContextType {
  isEnabled: boolean;
  isReady: boolean;
  hasKeys: boolean;
  initializeEncryption: (password: string) => Promise<void>;
  getRoomKey: (roomId: string) => Promise<CryptoKey | null>;
  encryptMessage: (message: string, roomId: string) => Promise<string>;
  decryptMessage: (encryptedMessage: string, roomId: string) => Promise<string>;
  setupNewUser: (password: string) => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isEnabled] = useState(encryption.isEncryptionSupported());
  const [isReady, setIsReady] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [privateKey, setPrivateKey] = useState<CryptoKey | null>(null);
  const [roomKeys, setRoomKeys] = useState<Map<string, CryptoKey>>(new Map());

  useEffect(() => {
    if (user && isEnabled) {
      checkForKeys();
    }
  }, [user, isEnabled]);

  async function checkForKeys() {
    if (!user) return;

    const storedPublicKey = encryption.getStoredPublicKey(user.id);
    const storedPrivateKey = encryption.getStoredPrivateKey(user.id);

    if (storedPublicKey && storedPrivateKey) {
      setHasKeys(true);
    } else {
      // Check if keys exist in database
      const { data } = await supabase
        .from('user_encryption_keys')
        .select('public_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && 'public_key' in data) {
        setHasKeys(true);
      }
    }
  }

  async function setupNewUser(password: string) {
    if (!user) throw new Error('No user logged in');

    // Generate new key pair
    const keyPair = await encryption.generateKeyPair();
    const publicKey = await encryption.exportPublicKey(keyPair.publicKey);
    const encryptedPrivateKey = await encryption.exportPrivateKey(keyPair.privateKey, password);

    // Store in localStorage
    encryption.storeKeyPair(user.id, publicKey, encryptedPrivateKey);

    // Store public key in database
    const { error } = await supabase
      .from('user_encryption_keys')
      .upsert({
        user_id: user.id,
        public_key: publicKey,
        updated_at: new Date().toISOString(),
      } as any);

    if (error) throw error;

    setPrivateKey(keyPair.privateKey);
    setHasKeys(true);
    setIsReady(true);
  }

  async function initializeEncryption(password: string) {
    if (!user) throw new Error('No user logged in');

    // Try to load from localStorage first
    let encryptedPrivateKey = encryption.getStoredPrivateKey(user.id);

    if (!encryptedPrivateKey) {
      // If not in localStorage, this might be a new device
      // In production, you'd want to implement key recovery mechanism
      throw new Error('Private key not found. Please set up encryption on this device.');
    }

    try {
      const loadedPrivateKey = await encryption.importPrivateKey(encryptedPrivateKey, password);
      setPrivateKey(loadedPrivateKey);
      setIsReady(true);
    } catch (error) {
      throw new Error('Invalid password or corrupted key');
    }
  }

  async function getRoomKey(roomId: string): Promise<CryptoKey | null> {
    // Check if we already have this room key in memory
    if (roomKeys.has(roomId)) {
      return roomKeys.get(roomId)!;
    }

    // Check session storage
    const storedKey = encryption.getStoredRoomKey(roomId);
    if (storedKey) {
      // Convert base64 string back to ArrayBuffer manually
      const binary = atob(storedKey);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const roomKey = await encryption.importRoomKey(bytes.buffer);
      setRoomKeys(new Map(roomKeys.set(roomId, roomKey)));
      return roomKey;
    }

    if (!user || !privateKey) return null;

    // Fetch encrypted room key from database
    const { data, error } = await supabase
      .from('room_member_keys')
      .select('encrypted_room_key')
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .single();

    if (error || !data || !('encrypted_room_key' in data)) {
      console.error('Failed to fetch room key:', error);
      return null;
    }

    try {
      // Decrypt room key with user's private key
      const roomKey = await encryption.decryptRoomKey((data as any).encrypted_room_key, privateKey);
      
      // Cache it
      setRoomKeys(new Map(roomKeys.set(roomId, roomKey)));
      
      // Store in session storage
      const exportedKey = await encryption.exportRoomKey(roomKey);
      // Convert ArrayBuffer to base64 manually
      const bytes = new Uint8Array(exportedKey);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      encryption.storeRoomKey(roomId, btoa(binary));

      return roomKey;
    } catch (error) {
      console.error('Failed to decrypt room key:', error);
      return null;
    }
  }

  async function encryptMessageFunc(message: string, roomId: string): Promise<string> {
    if (!isReady) {
      throw new Error('Encryption not initialized');
    }

    const roomKey = await getRoomKey(roomId);
    if (!roomKey) {
      throw new Error('Room key not available');
    }

    return await encryption.encryptMessage(message, roomKey);
  }

  async function decryptMessageFunc(encryptedMessage: string, roomId: string): Promise<string> {
    if (!isReady) {
      return encryptedMessage; // Return as-is if encryption not ready
    }

    const roomKey = await getRoomKey(roomId);
    if (!roomKey) {
      return '[Encrypted message - key not available]';
    }

    return await encryption.decryptMessage(encryptedMessage, roomKey);
  }

  return (
    <EncryptionContext.Provider
      value={{
        isEnabled,
        isReady,
        hasKeys,
        initializeEncryption,
        getRoomKey,
        encryptMessage: encryptMessageFunc,
        decryptMessage: decryptMessageFunc,
        setupNewUser,
      }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within EncryptionProvider');
  }
  return context;
}
