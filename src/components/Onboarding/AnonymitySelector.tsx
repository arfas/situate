import { useState } from 'react';
import { Eye, EyeOff, UserCircle, Shield } from 'lucide-react';

interface AnonymitySelectorProps {
  onSelect: (level: 'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified', displayName: string) => void;
  onCancel: () => void;
  defaultPseudonym?: string | null;
}

export function AnonymitySelector({ onSelect, onCancel, defaultPseudonym }: AnonymitySelectorProps) {
  const [selectedLevel, setSelectedLevel] = useState<'anonymous' | 'pseudonym' | 'semi_anonymous' | 'verified'>('anonymous');
  const [customName, setCustomName] = useState(defaultPseudonym || '');
  const [semiAnonInfo, setSemiAnonInfo] = useState({ age: '', location: '', occupation: '' });

  const generateRandomName = () => {
    const adjectives = ['Brave', 'Kind', 'Wise', 'Swift', 'Gentle', 'Strong', 'Bright', 'Silent'];
    const animals = ['Tiger', 'Eagle', 'Wolf', 'Bear', 'Fox', 'Hawk', 'Lion', 'Owl'];
    const num = Math.floor(Math.random() * 1000);
    return `${adjectives[Math.floor(Math.random() * adjectives.length)]}_${animals[Math.floor(Math.random() * animals.length)]}${num}`;
  };

  const handleSubmit = () => {
    let displayName = '';

    switch (selectedLevel) {
      case 'anonymous':
        displayName = generateRandomName();
        break;
      case 'pseudonym':
        displayName = customName || generateRandomName();
        break;
      case 'semi_anonymous':
        const parts = [];
        if (semiAnonInfo.age) parts.push(`${semiAnonInfo.age}`);
        if (semiAnonInfo.occupation) parts.push(semiAnonInfo.occupation);
        if (semiAnonInfo.location) parts.push(semiAnonInfo.location);
        displayName = parts.length > 0 ? parts.join(', ') : generateRandomName();
        break;
      case 'verified':
        displayName = customName || 'Verified User';
        break;
    }

    onSelect(selectedLevel, displayName);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            How do you want to appear?
          </h2>
          <p className="text-gray-600">
            Choose your privacy level for this room. You can change this for each room.
          </p>
        </div>

        <div className="p-6 space-y-4">
          <label
            className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedLevel === 'anonymous'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="anonymity"
                value="anonymous"
                checked={selectedLevel === 'anonymous'}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <EyeOff className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Fully Anonymous</span>
                </div>
                <p className="text-sm text-gray-600">
                  Random username (e.g., "Brave_Tiger472"). Complete privacy.
                </p>
              </div>
            </div>
          </label>

          <label
            className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedLevel === 'pseudonym'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="anonymity"
                value="pseudonym"
                checked={selectedLevel === 'pseudonym'}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Persistent Pseudonym</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Choose a nickname that stays consistent across rooms.
                </p>
                {selectedLevel === 'pseudonym' && (
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter your pseudonym"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </label>

          <label
            className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedLevel === 'semi_anonymous'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="anonymity"
                value="semi_anonymous"
                checked={selectedLevel === 'semi_anonymous'}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Semi-Anonymous</span>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Share basic info (e.g., "30s, tech worker, NYC")
                </p>
                {selectedLevel === 'semi_anonymous' && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={semiAnonInfo.age}
                      onChange={(e) => setSemiAnonInfo({ ...semiAnonInfo, age: e.target.value })}
                      placeholder="Age range (e.g., 30s)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={semiAnonInfo.occupation}
                      onChange={(e) => setSemiAnonInfo({ ...semiAnonInfo, occupation: e.target.value })}
                      placeholder="Occupation (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={semiAnonInfo.location}
                      onChange={(e) => setSemiAnonInfo({ ...semiAnonInfo, location: e.target.value })}
                      placeholder="Location (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>
          </label>

          <label
            className={`block p-4 border-2 rounded-xl cursor-pointer transition-all ${
              selectedLevel === 'verified'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="anonymity"
                value="verified"
                checked={selectedLevel === 'verified'}
                onChange={(e) => setSelectedLevel(e.target.value as any)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-gray-900">Verified Professional</span>
                </div>
                <p className="text-sm text-gray-600">
                  Show credentials (requires verification - coming soon)
                </p>
              </div>
            </div>
          </label>
        </div>

        <div className="p-6 border-t border-gray-200 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
