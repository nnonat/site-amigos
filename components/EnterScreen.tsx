"use client";

import { useState } from "react";

interface EnterScreenProps {
  onEnter: () => void;
}

export default function EnterScreen({ onEnter }: EnterScreenProps) {
  const [isEntering, setIsEntering] = useState(false);

  const handleClick = () => {
    setIsEntering(true);
    // Pequeno delay para animação
    setTimeout(() => {
      onEnter();
    }, 300);
  };

  return (
    <div
      className={`fixed inset-0 bg-transparent z-50 flex items-center justify-center transition-opacity duration-300 ${
        isEntering ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <button
        onClick={handleClick}
        className="text-white text-2xl font-light tracking-wide transition-all duration-200 hover:opacity-80 cursor-pointer"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        Clique aqui...
      </button>
    </div>
  );
}

