"use client";

import { useEffect, useState, useRef } from "react";
import { getAvatar } from "../lib/discord";
import { getApiUrl } from "../lib/api";

const STORAGE_KEY_LAST_SONG = "lastSpotifySong";
const STORAGE_KEY_LAST_SONG_DATE = "lastSpotifySongDate";

export default function ProfileCard() {
  const [data, setData] = useState<any>(null);
  const [presence, setPresence] = useState<any>(null);
  const [views, setViews] = useState(0);
  const [lastSong, setLastSong] = useState<any>(null);
  const [lastSongDate, setLastSongDate] = useState<string>("");
  const [escutandoAgora, setEscutandoAgora] = useState<boolean>(false);
  const hasIncrementedRef = useRef(false);

  useEffect(() => {
    const setZoom = () => {
      document.documentElement.style.zoom = "1";
      if ((window as any).chrome) {
        (document.body.style as any).zoom = "1";
      }
    };

    setZoom();
    window.addEventListener("resize", setZoom);

    // Carrega views e incrementa apenas uma vez
    const loadAndIncrementViews = async () => {
      if (hasIncrementedRef.current) return;
      hasIncrementedRef.current = true;

      try {
        // Primeiro incrementa
        const incrementRes = await fetch("/api/views", {
          method: "POST",
          cache: "no-store"
        });
        if (incrementRes.ok) {
          const incrementData = await incrementRes.json();
          setViews(incrementData.views);
        } else {
          // Se falhar, tenta apenas ler
          const getRes = await fetch("/api/views", { cache: "no-store" });
          if (getRes.ok) {
            const getData = await getRes.json();
            setViews(getData.views);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar views:", error);
        // Se falhar, tenta apenas ler
        try {
          const getRes = await fetch("/api/views", { cache: "no-store" });
          if (getRes.ok) {
            const getData = await getRes.json();
            setViews(getData.views);
          }
        } catch (e) {
          console.error("Erro ao ler views:", e);
        }
      }
    };

    loadAndIncrementViews();

    return () => {
      window.removeEventListener("resize", setZoom);
    };
  }, []);

  useEffect(() => {
    fetch("/api/discord", { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
      .then((r) => r.json())
      .then(setData);
  }, []);

  // Carrega última música salva do localStorage
  useEffect(() => {
    const savedLastSong = localStorage.getItem(STORAGE_KEY_LAST_SONG);
    const savedLastSongDate = localStorage.getItem(STORAGE_KEY_LAST_SONG_DATE);
    
    if (savedLastSong) {
      try {
        setLastSong(JSON.parse(savedLastSong));
        if (savedLastSongDate) {
          setLastSongDate(savedLastSongDate);
        }
      } catch (e) {
        console.error("Erro ao carregar última música:", e);
      }
    }
  }, []);

  // Formata data da última música
  const getLastSongDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  useEffect(() => {
    if (!data?.user?.id) return;

    const fetchPresence = () => {
      // Adiciona timestamp para evitar cache
      const timestamp = Date.now();
      fetch(`${getApiUrl()}/presence/${data.user.id}?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then((r) => r.json())
        .then((presenceData) => {
          setPresence(presenceData);
          
          // Se houver atividade do Spotify, salva como última música
          const activities = presenceData?.activities ?? [];
          const spotifyAct = activities.find((activity: any) =>
            activity.name === "Spotify" ||
            activity.name?.toLowerCase().includes("spotify") ||
            activity.assets?.large_image?.startsWith("spotify:")
          );
          
          // Atualiza o estado de escutandoAgora (está dentro da atividade do Spotify)
          if (spotifyAct) {
            setEscutandoAgora(spotifyAct?.escutandoAgora === true);
            
            const songData = {
              details: spotifyAct.details || spotifyAct.assets?.large_text || "Sem título",
              state: spotifyAct.state || "Artista desconhecido",
              large_image: spotifyAct.assets?.large_image || null
            };
            setLastSong(songData);
            const currentDate = getLastSongDate();
            setLastSongDate(currentDate);
            localStorage.setItem(STORAGE_KEY_LAST_SONG, JSON.stringify(songData));
            localStorage.setItem(STORAGE_KEY_LAST_SONG_DATE, currentDate);
          } else {
            // Se não houver atividade do Spotify, não está ouvindo agora
            setEscutandoAgora(false);
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar presence:", error);
        });
    };

    fetchPresence();
    const interval = setInterval(fetchPresence, 3000);

    return () => clearInterval(interval);
  }, [data?.user?.id]);

  if (!data) return <div className="text-white">Carregando…</div>;

  const avatar = getAvatar(data.user);
  const status = presence?.status ?? "offline";
  const globalName = data?.user?.global_name || data?.user?.username || "";
  const username = data?.user?.username || "";
  const activities = presence?.activities ?? [];
  const connectedAccounts = data?.connected_accounts ?? [];

  // Função para obter a URL da badge do Discord
  const getBadgeIconUrl = (badge: any): string | null => {
    if (!badge) return null;
    // Se for uma badge customizada, pode ter uma URL direta
    if (badge.icon && badge.icon.startsWith("http")) {
      return badge.icon;
    }
    // Badge padrão do Discord - usa o campo 'icon' que contém o ID
    if (badge.icon) {
      return `https://cdn.discordapp.com/badge-icons/${badge.icon}.png`;
    }
    return null;
  };

  // Badges do Discord (por enquanto todas, depois pode filtrar)
  const discordBadges = data?.badges ?? [];
  // Badge customizada (pode ser adicionada aqui)
  

  // Mapeia o status para o ícone correspondente
  const getStatusIcon = (status: string) => {
    const statusMap: { [key: string]: string } = {
      online: "/status/online.png",
      idle: "/status/idle.png",
      dnd: "/status/dnd.png",
      offline: "/status/offline.png"
    };
    return statusMap[status.toLowerCase()] || "/status/offline.png";
  };

  // Encontra atividade do Spotify
  const spotifyActivity = activities.find((activity: any) =>
    activity.name === "Spotify" ||
    activity.name?.toLowerCase().includes("spotify") ||
    activity.assets?.large_image?.startsWith("spotify:")
  );

  // Usa a atividade atual ou a última música salva
  const displaySong = spotifyActivity || lastSong;
  const displaySongDate = spotifyActivity ? getLastSongDate() : lastSongDate;

  // Encontra atividade "Code"
  const codeActivity = activities.find((activity: any) => 
    activity.name === "Code"
  );

  // Extrai a URL da imagem do Spotify
  const getSpotifyImageUrl = (largeImage: string | null | undefined): string | null => {
    if (!largeImage) return null;
    const imageId = largeImage.replace(/^spotify:/, "");
    if (/^[a-f0-9]+$/i.test(imageId) && imageId.length >= 16) {
      return `https://i.scdn.co/image/${imageId}`;
    }
    return null;
  };

  // Extrai a URL da imagem de atividades do Discord (especialmente Code)
  const getActivityImageUrl = (activity: any): string | null => {
    if (!activity?.assets?.large_image) return null;
    const largeImage = activity.assets.large_image;
    
    // Se já for uma URL completa, retorna
    if (largeImage.startsWith("http")) {
      return largeImage;
    }
    
    // Processa URLs no formato mp:external/.../https/...
    // Exemplo: mp:external/ledVVfR9-gwyjYvoVaqZjX0LJmFiM51gyQ3hlIhUyK0/https/raw.githubusercontent.com/...
    // Deve virar: https://raw.githubusercontent.com/...
    if (largeImage.startsWith("mp:external/")) {
      const parts = largeImage.split("/");
      const httpsIndex = parts.findIndex(part => part === "https");
      if (httpsIndex !== -1 && httpsIndex < parts.length - 1) {
        // Pega tudo depois de "https" e reconstrói a URL com "https://"
        const urlParts = parts.slice(httpsIndex + 1);
        return `https://${urlParts.join("/")}`;
      }
    }
    
    // Se for uma imagem do Discord CDN
    if (activity.application_id) {
      return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${largeImage}.png`;
    }
    
    return null;
  };

  const spotifyImageUrl = displaySong?.large_image
    ? getSpotifyImageUrl(displaySong.large_image)
    : displaySong?.assets?.large_image
    ? getSpotifyImageUrl(displaySong.assets.large_image)
    : null;

  const codeActivityImageUrl = codeActivity ? getActivityImageUrl(codeActivity) : null;

  // Redes sociais fixas
  const socialLinks = [
    
    // {
    //   name: "Spotify",
    //   url: "https://open.spotify.com/user/31fbvvsgag3fzdhnfcdlfpbl7gz4?si=dd0673c1bbb2490d", // Você pode adicionar o username aqui
    //   icon: (
    //     <svg className="w-6 h-6 text-gray-400 transition-transform duration-200 hover:scale-110" fill="currentColor" viewBox="0 0 24 24">
    //       <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.84-.179-.84-.66 0-.359.24-.66.54-.779 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.242 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.42 1.56-.299.421-1.02.599-1.559.3z" />
    //     </svg>
    //   )
    // },
    // {
    //   name: "TikTok",
    //   url: "https://tiktok.com", // Você pode adicionar o username aqui
    //   icon: (
    //     <svg className="w-6 h-6 text-gray-400 hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
    //       <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    //     </svg>
    //   )
    // },
    // {
    //   name: "LinkedIn",
    //   url: "https://linkedin.com", // Você pode adicionar o username aqui
    //   icon: (
    //     <svg className="w-6 h-6 text-gray-400 hover:text-blue-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
    //       <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    //     </svg>
    //   )
    // },
    // {
    //   name: "Discord",
    //   url: "https://discord.com", // Você pode adicionar o username aqui
    //   icon: (
    //     <svg className="w-6 h-6 text-gray-400 hover:text-indigo-500 transition-colors" fill="currentColor" viewBox="0 0 24 24">
    //       <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
    //     </svg>
    //   )
    // }
  ];

  return (
    <>
      {/* Contador de Visualizações - Canto superior esquerdo da página */}
      <div className="fixed top-2 left-2 bg-black/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2 border border-white/10 shadow-lg z-50 animate-fade-in">
        <svg className="w-4 h-4 border-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-white text-base font-medium">{views.toLocaleString()}</span>
      </div>

      <div className="relative w-full max-w-2xl mx-auto group animate-fade-in-up">
        {/* Card Principal */}
        <div className="bg-black rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm relative transition-all duration-300 hover:shadow-white/10">
          {/* Botão de Link para Discord - aparece no hover */}
          <a
            href={`https://discord.com/users/${data?.user?.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/80 hover:bg-black rounded-lg p-2 cursor-pointer z-50 pointer-events-auto group/discord"
          >
            {/* Tooltip */}
            <span className="absolute bottom-full right-0 translate-x-2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/95 backdrop-blur-sm rounded-md whitespace-nowrap opacity-0 group-hover/discord:opacity-100 group-hover/discord:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50 border border-white/20 shadow-lg">
              Perfil do Discord

              {/* Seta */}
              <span className="absolute top-full right-3 -mt-1 border-4 border-transparent border-t-gray-900/95"></span>
            </span>
            <svg className="w-4 h-4 text-white group-hover/discord:text-blue-500 transition-colors pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          {/* Perfil do Usuário */}
          <div className="flex items-start gap-4 mb-6 relative animate-fade-in">
            <div className="relative group/avatar">
              <img
                src={avatar}
                className="w-20 h-20 rounded-full border-2 border-white/20 transition-transform duration-300 "
                alt="Avatar"
              />
              {/* Ícone de Status - sobreposto no canto inferior direito */}
              <div className="absolute bottom-0.5 right-0.5 bg-black rounded-full p-0.5 animate-pulse-slow">
                <img
                  src={getStatusIcon(status)}
                  alt={status}
                  className="w-4 h-4"
                  title={status.charAt(0).toUpperCase() + status.slice(1)}
                />
              </div>
            </div>
            <div className="flex-1 flex items-start gap-6">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white transition-all duration-300 hover:text-gray-200 whitespace-nowrap leading-tight">{globalName}</h1>
                <p className="text-gray-400 text-sm mt-0.5">@{username}</p>
                <div className="flex gap-2 mt-1">
                {/* Badge customizada (se houver) */}
                {/* Badges do Discord */}
                {discordBadges.map((badge: any, index: number) => {
                  const badgeUrl = getBadgeIconUrl(badge);
                  return (
                    <div
                      key={badge.id || index}
                      className="cursor-pointer relative w-6 h-6 rounded bg-zinc-900 flex items-center justify-center transition-transform duration-200 hover:scale-110 group/badge"
                      style={{ animationDelay: `${(0 ? 1 : 0) + index * 100}ms` }}
                    >
                      {badgeUrl ? (
                        <img
                          src={badgeUrl}
                          alt={badge.description || badge.id || "Badge"}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className="text-xs">⭐</span>
                      )}
                      {/* Tooltip animado */}
                      {badge.description && (
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/95 backdrop-blur-sm rounded-md whitespace-nowrap opacity-0 group-hover/badge:opacity-100 group-hover/badge:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50 border border-white/20 shadow-lg">
                          {badge.description}
                          {/* Seta do tooltip */}
                          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></span>
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bio - apenas para desktop */}
          {data?.bio && (
            <div className="absolute top-0 right-32 max-w-xs mr-20 hidden md:block">
              <p className="text-gray-300 text-sm whitespace-pre-wrap break-words leading-tight">
                {data.bio}
              </p>
            </div>
          )}

            {/* Redes Sociais - 2 fileiras de 3 ícones, posicionadas mais à direita e acima */}
            <div className="absolute top-0 right-8 flex flex-col gap-3">
              {/* Primeira fileira de 3 */}
              <div className="flex gap-4">
                {socialLinks.slice(0, 3).map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-8 h-8 flex items-center justify-center cursor-pointer group/social"
                  >
                    {social.icon}
                    {/* Tooltip animado */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/95 backdrop-blur-sm rounded-md whitespace-nowrap opacity-0 group-hover/social:opacity-100 group-hover/social:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50 border border-white/20 shadow-lg">
                      {social.name}
                      {/* Seta do tooltip */}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></span>
                    </span>
                  </a>
                ))}
              </div>
              {/* Segunda fileira de 3 */}
              <div className="flex gap-4">
                {socialLinks.slice(3, 6).map((social, index) => (
                  <a
                    key={index + 3}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative w-8 h-8 flex items-center justify-center cursor-pointer group/social"
                  >
                    {social.icon}
                    {/* Tooltip animado */}
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900/95 backdrop-blur-sm rounded-md whitespace-nowrap opacity-0 group-hover/social:opacity-100 group-hover/social:translate-y-0 translate-y-1 transition-all duration-200 pointer-events-none z-50 border border-white/20 shadow-lg">
                      {social.name}
                      {/* Seta do tooltip */}
                      <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900/95"></span>
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Atividade Code */}
          {codeActivity && (
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <h2 className="text-white font-semibold">Programming</h2>
              </div>

              <div className="flex gap-4 group/code">
                {codeActivityImageUrl ? (
                  <img
                    src={codeActivityImageUrl}
                    alt={codeActivity.name}
                    className="w-24 h-24 rounded-lg object-cover border border-white/10 shadow-lg transition-transform duration-300 group-hover/code:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover/code:scale-105">
                    <span className="text-3xl">💻</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-1 truncate transition-colors duration-200 group-hover/code:text-gray-200">
                    {codeActivity.details || codeActivity.assets?.large_text || codeActivity.name}
                  </h3>
                  {codeActivity.state && (
                    <p className="text-gray-400 text-sm mb-2 truncate">
                      {codeActivity.state}
                    </p>
                  )}
                  {codeActivity.assets?.small_text && (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <span>{codeActivity.assets.small_text}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Última Música / Ouvindo Agora */}
          {displaySong && (
            <div className="mb-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <h2 className="text-white font-semibold">{escutandoAgora ? "Ouvindo Agora" : "Última música"}</h2>
                </div>
                {escutandoAgora ? (
                  <span className="flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-gray-700/50">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Ao vivo
                  </span>
                ) : (
                  displaySongDate && (
                    <span className="text-gray-500 text-xs">{displaySongDate}</span>
                  )
                )}
              </div>

              <div className="flex gap-4 group/spotify">
                {spotifyImageUrl ? (
                  <img
                    src={spotifyImageUrl}
                    alt="Album Art"
                    className="w-24 h-24 rounded-lg object-cover border border-white/10 shadow-lg transition-transform duration-300 group-hover/spotify:scale-105"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 flex items-center justify-center transition-transform duration-300 group-hover/spotify:scale-105">
                    <span className="text-3xl">🎵</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-lg mb-1 truncate transition-colors duration-200 group-hover/spotify:text-gray-200">
                    {displaySong.details || displaySong.assets?.large_text || "Sem título"}
                  </h3>
                  <p className="text-gray-400 text-sm mb-2 truncate">
                    {displaySong.state || "Artista desconhecido"}
                  </p>
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Reproduzida via Spotify</span>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* ID do Usuário */}

        </div>
      </div>
    </>
  );
}