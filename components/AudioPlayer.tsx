"use client";

import { useEffect, useRef, useState } from "react";

const musicFiles = [
  "/music/Loneliness - Decalius.mp3",
  "/music/All Mine - Nokia Angel.mp3",
  "/music/Red Tear Drop Goth Crip - Sickboyrari.mp3",
  "/music/Squeeze - Ghostemane.mp3",
  "/music/wavy dreams - dedwrite.mp3",
];

const STORAGE_KEY_MUSIC = "lastMusic";
const STORAGE_KEY_POSITION = "lastMusicPosition";
const STORAGE_KEY_VOLUME = "lastMusicVolume";

interface AudioPlayerProps {
  shouldPlay?: boolean;
}

export default function AudioPlayer({ shouldPlay = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [currentMusic, setCurrentMusic] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.10);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Carregamento inicial - sempre escolhe uma música aleatória
  useEffect(() => {
    // Sempre escolhe uma música aleatória ao recarregar
    const randomIndex = Math.floor(Math.random() * musicFiles.length);
    
    setCurrentIndex(randomIndex);
    setCurrentMusic(musicFiles[randomIndex]);
    setVolume(0.10);
  }, []);


  
  // Quando a música muda, não reseta o áudio, só o estado visual
  useEffect(() => {
    setCurrentTime(0);
  }, [currentMusic]);

  // Atualiza tempo e duração
  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      // Quando a música acabar, passa para a próxima
      const nextIndex = (currentIndex + 1) % musicFiles.length;
      setCurrentIndex(nextIndex);
      setCurrentMusic(musicFiles[nextIndex]);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("canplay", updateDuration);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("canplay", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [currentMusic, currentIndex]);

  // Aplica volume (não reseta nada)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

// shouldPlay com volume correto ANTES do play()
useEffect(() => {
    if (!shouldPlay || !audioRef.current) return;
  
    const audio = audioRef.current;
  
    const start = async () => {
      try {
        // 🔥 aplica volume ANTES de tocar
        audio.volume = volume;
        await audio.play();
        setIsPlaying(true);
      } catch {}
    };
  
    start();
  }, [shouldPlay, currentMusic, volume]);
  
  // Salvar música no localStorage
  useEffect(() => {
    if (currentMusic) {
      localStorage.setItem(STORAGE_KEY_MUSIC, currentMusic);
    }
  }, [currentMusic]);

  const togglePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const nextMusic = () => {
    const nextIndex = (currentIndex + 1) % musicFiles.length;
    setCurrentIndex(nextIndex);
    setCurrentMusic(musicFiles[nextIndex]);
  };

  const previousMusic = () => {
    const prevIndex = (currentIndex - 1 + musicFiles.length) % musicFiles.length;
    setCurrentIndex(prevIndex);
    setCurrentMusic(musicFiles[prevIndex]);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    localStorage.setItem(STORAGE_KEY_VOLUME, newVolume.toString());

    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;

    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const getMusicName = (path: string) => {
    return (
      path.split("/").pop()?.replace(".mp3", "").replace(".ogg", "").replace(".wav", "") ||
      "Música"
    );
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (!currentMusic) return null;

  const musicName = getMusicName(currentMusic);

  return (
    <>
      <audio ref={audioRef} src={currentMusic} preload="auto" className="hidden" />

      {/* UI */}
      <div className="w-72 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg transition-all duration-300 hover:shadow-white/10 hover:border-white/20">
        {/* Controles e Nome da Música */}
        <div className="flex items-center gap-2 mb-2">
          <button 
            onClick={previousMusic} 
            className="p-1.5 hover:bg-white/10 rounded transition-all duration-200 hover:scale-110 flex-shrink-0"
            title="Anterior"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            onClick={togglePlayPause} 
            className="p-1.5 hover:bg-white/10 rounded transition-all duration-200 hover:scale-110 flex-shrink-0"
            title={isPlaying ? "Pausar" : "Tocar"}
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          
          <button 
            onClick={nextMusic} 
            className="p-1.5 hover:bg-white/10 rounded transition-all duration-200 hover:scale-110 flex-shrink-0"
            title="Próxima"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>

          {/* Nome da música com scroll */}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-white text-sm truncate">
              {musicName}
            </div>
          </div>
        </div>

        {/* Barra de Progresso */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-white text-xs w-8 text-right flex-shrink-0">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            step="0.1"
            onChange={handleProgressChange}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span className="text-white text-xs w-8 flex-shrink-0">{formatTime(duration)}</span>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {volume === 0 ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            )}
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
          />
          <span className="text-white text-xs w-8 text-right flex-shrink-0">{Math.round(volume * 100)}%</span>
        </div>
      </div>
    </>
  );
}
