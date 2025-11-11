import React, { useState } from 'react';
import { MicrophoneIcon } from './Icons';

interface RememberPersonDialogProps {
  onClose: () => void;
  onSave: (name: string) => void;
  onSpeakName: () => void;
  isListening: boolean;
}

const RememberPersonDialog: React.FC<RememberPersonDialogProps> = ({ onClose, onSave, onSpeakName, isListening }) => {
  const [name, setName] = useState('');

  const handleSaveClick = () => {
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSaveClick();
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center z-20" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="bg-gray-800 text-white p-6 rounded-lg shadow-xl w-11/12 max-w-md">
        <h2 id="dialog-title" className="text-2xl font-bold mb-4 text-center">Remember Person</h2>
        <p className="mb-4 text-center text-gray-300">Enter or speak the person's name.</p>
        
        <div className="flex items-center space-x-2 mb-6">
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter name..."
                className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Person's name"
                autoFocus
            />
            <button
                onClick={onSpeakName}
                className={`p-3 rounded-full ${isListening ? 'bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} focus:outline-none focus:ring-2 focus:ring-blue-400 transform transition-transform active:scale-95`}
                aria-label={isListening ? "Listening for name" : "Speak name"}
            >
                <MicrophoneIcon />
            </button>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveClick}
            disabled={!name.trim() || isListening}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md font-semibold transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RememberPersonDialog;
