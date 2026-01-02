import { useState } from 'react';
import { Shield, Lock, AlertCircle } from 'lucide-react';
import { useEncryption } from '../../contexts/EncryptionContext';

interface EncryptionSetupProps {
  onComplete: () => void;
}

export function EncryptionSetup({ onComplete }: EncryptionSetupProps) {
  const { hasKeys, setupNewUser, initializeEncryption } = useEncryption();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(!hasKeys);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSetup) {
        // New user setup
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        await setupNewUser(password);
      } else {
        // Existing user unlock
        await initializeEncryption(password);
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Failed to initialize encryption');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center w-16 h-16 bg-slate-800 dark:bg-slate-700 rounded-2xl mb-6 mx-auto">
          <Shield className="w-8 h-8 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
          {isSetup ? 'Setup Encryption' : 'Unlock Encryption'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm text-center">
          {isSetup
            ? 'Create a password to encrypt your messages end-to-end'
            : 'Enter your password to unlock encrypted messages'}
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-300">
              <p className="font-semibold mb-1">Important:</p>
              <p>
                This password encrypts your private key. If you lose it, you won't be able to
                decrypt your messages. Store it securely!
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {isSetup ? 'Create Password' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isSetup ? 8 : undefined}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 focus:outline-none transition-all duration-200 text-sm text-gray-900 dark:text-white"
                placeholder={isSetup ? 'At least 8 characters' : 'Enter your password'}
              />
            </div>
          </div>

          {isSetup && (
            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 focus:outline-none transition-all duration-200 text-sm text-gray-900 dark:text-white"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isSetup ? 'Setting up...' : 'Unlocking...'}
              </span>
            ) : (
              <span>{isSetup ? 'Enable Encryption' : 'Unlock Messages'}</span>
            )}
          </button>
        </form>

        {!isSetup && (
          <button
            onClick={() => setIsSetup(true)}
            className="w-full mt-4 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
          >
            Lost your password? Set up new keys
          </button>
        )}
      </div>
    </div>
  );
}
