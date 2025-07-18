'use client';

import { useRef, useEffect, createContext, useContext, useState } from 'react';

interface AudioContextType {
  currentlyPlaying: string | null;
  volume: number;
  setVolume: (volume: number) => void;
  playSound: (soundFile: string) => void;
  stopAll: () => void;
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Load mute state from localStorage
    const savedMuted = localStorage.getItem('muted');
    if (savedMuted) {
      setIsMuted(JSON.parse(savedMuted));
    }
  }, []);

  const playSound = (soundFile: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(`/api/audio/${soundFile}`);
    audio.volume = isMuted ? 0 : volume / 100;
    audioRef.current = audio;
    
    audio.play().catch(console.error);
    setCurrentlyPlaying(soundFile);
    
    audio.onended = () => {
      setCurrentlyPlaying(null);
    };
  };

  const stopAll = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentlyPlaying(null);
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    localStorage.setItem('muted', JSON.stringify(newMuted));
    
    // Update current audio volume if playing
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume / 100;
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  return (
    <AudioContext.Provider
      value={{
        currentlyPlaying,
        volume,
        setVolume,
        playSound,
        stopAll,
        isMuted,
        toggleMute,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}