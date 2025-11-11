import React from 'react';
import { PlayIcon } from './Icons';

interface SplashScreenProps {
  onStart: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onStart }) => {
  return (
    <div className="bg-black text-white h-screen w-screen flex flex-col items-center justify-center p-8 text-center">
      <header className="mb-12">
        <h1 className="text-5xl font-bold mb-4">OptiRead</h1>
        <p className="text-xl text-gray-300">
          Your AI assistant for the visual world.
        </p>
      </header>
      <main className="flex-grow flex flex-col items-center justify-center">
        <button
          onClick={onStart}
          className="flex flex-col items-center justify-center text-green-400 hover:text-green-300 focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-50 rounded-full transition-colors duration-200 p-4"
          aria-label="Start OptiRead"
        >
          <PlayIcon />
          <span className="mt-4 text-2xl font-semibold">Start</span>
        </button>
      </main>
      <footer className="mt-12">
        <p className="text-gray-400">
          Tap 'Start' to activate the camera and sound.
        </p>
      </footer>
    </div>
  );
};

export default SplashScreen;
