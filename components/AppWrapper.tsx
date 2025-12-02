"use client";

import { useState } from "react";
import EnterScreen from "./EnterScreen";
import AudioPlayer from "./AudioPlayer";
import DiscordServerCard from "./DiscordServerCard";
import { DotPattern } from "./DotPattern";

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [hasEntered, setHasEntered] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);

  const handleEnter = () => {
    setHasEntered(true);
    setShouldPlay(true);
  };

  return (
    <>
      {/* Carrega tudo em background (invisível até clicar) */}
      <div className={hasEntered ? "opacity-100" : "opacity-0 pointer-events-none"}>
        {/* Background com padrão de pontos - apenas no site */}

        {/* Container para os componentes fixos no canto inferior esquerdo */}
        {/* No mobile: z-40 para ficar atrás do card, no desktop: z-50 */}
        <div className="fixed bottom-4 left-4 z-40 md:z-50 flex flex-col gap-3 pointer-events-auto">
          <DiscordServerCard />
          <AudioPlayer shouldPlay={shouldPlay} />
        </div>
        {children}
      </div>
      
      {/* Tela de entrada por cima */}
      {!hasEntered && (
        <div className="fixed inset-0 z-50">
          <EnterScreen onEnter={handleEnter} />
        </div>
      )}
    </>
  );
}

