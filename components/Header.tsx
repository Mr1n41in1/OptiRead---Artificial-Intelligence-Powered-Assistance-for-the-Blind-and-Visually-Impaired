import React from 'react';
import { Language } from '../types';

interface HeaderProps {
  isOnline: boolean;
  selectedLanguage: string;
  onLanguageChange: (langCode: string) => void;
  languages: Language[];
  isContinuousMode: boolean;
  onModeChange: (isContinuous: boolean) => void;
  speechRate: number;
  onSpeechRateChange: (rate: number) => void;
}

const Header: React.FC<HeaderProps> = ({ isOnline, selectedLanguage, onLanguageChange, languages, isContinuousMode, onModeChange, speechRate, onSpeechRateChange }) => {
  return (
    <header className="absolute top-0 left-0 right-0 z-10 p-4 bg-black bg-opacity-50 text-white flex flex-wrap justify-end items-center gap-4">
      <div className="flex items-center flex-wrap justify-center sm:justify-end gap-x-4 gap-y-2">
        <div className="flex items-center space-x-2" aria-live="polite">
          <span className={`text-sm font-medium ${!isContinuousMode ? 'text-white' : 'text-gray-400'}`}>Manual</span>
            <button
              onClick={() => onModeChange(!isContinuousMode)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black ${
                isContinuousMode ? 'bg-blue-600' : 'bg-gray-600'
              }`}
              role="switch"
              aria-checked={isContinuousMode}
              aria-label={`Switch to ${isContinuousMode ? 'Manual' : 'Continuous'} mode`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isContinuousMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          <span className={`text-sm font-medium ${isContinuousMode ? 'text-white' : 'text-gray-400'}`}>Continuous</span>
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="speech-rate-slider" className="text-sm font-medium">Speed</label>
          <input
            id="speech-rate-slider"
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={speechRate}
            onChange={(e) => onSpeechRateChange(parseFloat(e.target.value))}
            className="w-24 cursor-pointer"
            aria-valuetext={`${speechRate}x`}
          />
          <span className="text-sm w-10 text-right tabular-nums">{speechRate.toFixed(1)}x</span>
        </div>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Select language"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <div className="flex items-center space-x-2">
          <span className={`h-4 w-4 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;