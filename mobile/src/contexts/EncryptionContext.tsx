import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import * as encryption from '../lib/encryption';

interface EncryptionContextType {
  isEnabled: boolean;
  isReady: boolean;
  hasKeys: boolean;
  setupNewUser: (password: string) => Promise<void>;
  unlockKeys: (password: string) => Promise<void>;
  decryptMessage: (encryptedContent: string, roomId: string) => Promise<string>;
}

const EncryptionContext = createContext<EncryptionContextType | undefined>(undefined);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasKeys, setHasKeys] = useState(false);
  const [roomKeyCache] = useState(new Map<string, CryptoKey>());

  useEffect(() => {
    if (user) {
      checkEncryptionStatus();
    } else {
      setIsEnabled(false);
      setIsReady(false);
      setHasKeys(false);
    }
  }, [user]);

  async function checkEncryptionStatus() {
    if (!user) return;

    const localKeys = await encryption.getStoredKeys(user.id);
    if (localKeys) {
      setHasKeys(true);
    } else {
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

    const keyPair = await encryption.generateKeyPair();
    const publicKey = await encryption.exportPublicKey(keyPair.publicKey);
    const encryptedPrivateKey = await encryption.exportPrivateKey(keyPair.privateKey, password);

    await encryption.storeKeyPair(user.id, publicKey, encryptedPrivateKey);

    const { error } = await supabase
      .from('user_encryption_keys')
      .upsert({
        user_id: user.id,
        public_key: publicKey,
        updated_at: new Date().toISOString(),
      } as any);

    if (error) throw error;

    setHasKeys(true);
    setIsEnabled(true);
    setIsReady(true);
  }

  async function unlockKeys(password: string) {
    if (!user) throw new Error('No user logged in');

    const keys = await encryption.getStoredKeys(user.id);
    if (!keys) throw new Error('No keys found');

    const privateKey = await encryption.importPrivateKey(keys.encryptedPrivateKey, password);
    
    setIsEnabled(true);
    setIsReady(true);
  }

  async function decryptMessage(encryptedContent: string, roomId: string): Promise<string> {
    if (!user || !isReady) return encryptedContent;

    try {
      let roomKey = roomKeyCache.get(roomId);
      
      if (!roomKey) {
        const { data } = await supabase
          .from('room_member_keys')
          .select('encrypted_room_key')
          .eq('room_id', roomId)
          .eq('user_id', user.id)
          .single();

        if (!data) throw new Error('No room key found');

        const keys = await encryption.getStoredKeys(user.id);
        if (!keys) throw new Error('No user keys');

        roomKey = await encryption.decryptRoomKey(
          data.encrypted_room_key,
          keys.encryptedPrivateKey,
          '' // Password should be cached
        );
        
        roomKeyCache.set(roomId, roomKey);
      }

      return await encryption.decryptMessage(encryptedContent, roomKey);
    } catch (error) {
      console.error('Decryption failed:', error);
      return '[Decryption failed]';
    }
  }

  return (
    <EncryptionContext.Provider value={{
      isEnabled,
      isReady,
      hasKeys,
      setupNewUser,
      unlockKeys,
      decryptMessage,
    }}>
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (context === undefined) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
}
