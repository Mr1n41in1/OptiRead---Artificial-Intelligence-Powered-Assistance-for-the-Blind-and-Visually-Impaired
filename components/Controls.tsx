import React from 'react';
import { DescribeSceneIcon, PersonIcon, AskIcon, NavigationIcon, StopIcon, RememberPersonIcon } from './Icons';
import { Feature } from '../types';

interface ControlsProps {
  onDescribeSceneClick: () => void;
  onDescribePersonClick: () => void;
  onAskClick: () => void;
  onNavigationClick: () => void;
  onRememberPersonClick: () => void;
  activeFeature: Feature;
  isDisabled: boolean;
}

const Controls: React.FC<ControlsProps> = ({
  onDescribeSceneClick,
  onDescribePersonClick,
  onAskClick,
  onNavigationClick,
  onRememberPersonClick,
  activeFeature,
  isDisabled,
}) => {
  const baseButtonClasses = "flex flex-col items-center justify-center w-full h-full text-white font-bold rounded-lg shadow-lg transform transition-transform duration-150 focus:outline-none focus:ring-4 focus:ring-opacity-50 active:scale-95";

  const getButtonState = (buttonFeature: Feature) => {
    const isActive = activeFeature === buttonFeature;
    return { isActive };
  };

  const describeState = getButtonState(Feature.DescribeScene);
  const personState = getButtonState(Feature.Person);
  const askState = getButtonState(Feature.Ask);
  const navState = getButtonState(Feature.Navigation);

  return (
    <footer className="absolute bottom-0 left-0 right-0 z-10 p-2 sm:p-4 bg-black bg-opacity-75">
      <div className="grid grid-cols-5 gap-2 sm:gap-4">
        <button
          onClick={onDescribeSceneClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} ${describeState.isActive ? 'bg-red-700 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'} focus:ring-blue-400 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-blue-600' : ''}`}
          aria-label={describeState.isActive ? "Stop" : "Describe Scene"}
          aria-disabled={isDisabled}
        >
          {describeState.isActive ? <StopIcon /> : <DescribeSceneIcon />}
          <span className="mt-1 text-xs sm:text-sm">{describeState.isActive ? 'Stop' : 'Scene'}</span>
        </button>
        <button
          onClick={onDescribePersonClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} ${personState.isActive ? 'bg-red-700 animate-pulse' : 'bg-green-600 hover:bg-green-700'} focus:ring-green-400 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-green-600' : ''}`}
          aria-label={personState.isActive ? "Stop" : "Describe Person"}
          aria-disabled={isDisabled}
        >
          {personState.isActive ? <StopIcon /> : <PersonIcon />}
          <span className="mt-1 text-xs sm:text-sm">{personState.isActive ? 'Stop' : 'Person'}</span>
        </button>
        <button
          onClick={onRememberPersonClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} bg-purple-600 hover:bg-purple-700 focus:ring-purple-400 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-purple-600' : ''}`}
          aria-label={"Remember Person"}
          aria-disabled={isDisabled}
        >
          <RememberPersonIcon />
          <span className="mt-1 text-xs sm:text-sm">Remember</span>
        </button>
        <button
          onClick={onAskClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} ${askState.isActive ? 'bg-yellow-700 animate-pulse' : 'bg-yellow-500 hover:bg-yellow-600'} focus:ring-yellow-300 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-yellow-500' : ''}`}
          aria-label={askState.isActive ? "Listening for your question" : "Ask a question"}
          aria-disabled={isDisabled}
        >
          <AskIcon />
          <span className="mt-1 text-xs sm:text-sm">{askState.isActive ? 'Asking...' : 'Ask'}</span>
        </button>
        <button
          onClick={onNavigationClick}
          disabled={isDisabled}
          className={`${baseButtonClasses} ${navState.isActive ? 'bg-red-700 animate-pulse' : 'bg-red-500 hover:bg-red-600'} focus:ring-red-400 ${isDisabled ? 'opacity-50 cursor-not-allowed hover:bg-red-500' : ''}`}
          aria-label={navState.isActive ? "Stop Navigation" : "Start Navigation"}
          aria-disabled={isDisabled}
        >
          {navState.isActive ? <StopIcon /> : <NavigationIcon />}
          <span className="mt-1 text-xs sm:text-sm">{navState.isActive ? 'Stop' : 'Navigate'}</span>
        </button>
      </div>
    </footer>
  );
};

export default Controls;
