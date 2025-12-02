"use client";

import { useEffect, useState } from "react";

interface DiscordInviteData {
  code: string;
  guild: {
    id: string;
    name: string;
    icon: string | null;
    description: string | null;
  };
  approximate_member_count: number;
  approximate_presence_count: number;
}

export default function DiscordServerCard() {
  const [serverData, setServerData] = useState<DiscordInviteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const response = await fetch("https://discord.com/api/v8/invites/wv5ZVzBgpU?with_counts=true", {
          cache: "no-store"
        });
        
        if (response.ok) {
          const data = await response.json();
          setServerData({
            code: data.code,
            guild: {
              id: data.guild.id,
              name: data.guild.name,
              icon: data.guild.icon,
              description: data.guild.description
            },
            approximate_member_count: data.approximate_member_count || 0,
            approximate_presence_count: data.approximate_presence_count || 0
          });
        }
      } catch (error) {
        console.error("Erro ao buscar dados do servidor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
    // Atualiza a cada 30 segundos
    const interval = setInterval(fetchServerData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !serverData) {
    return (
      <div className="w-72 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 rounded-lg animate-pulse"></div>
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2 animate-pulse"></div>
            <div className="h-3 bg-white/10 rounded w-1/2 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  const iconUrl = serverData.guild.icon
    ? `https://cdn.discordapp.com/icons/${serverData.guild.id}/${serverData.guild.icon}.png?size=128`
    : null;

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + "k";
    }
    return num.toString();
  };

  return (
    <a
      href={`https://discord.gg/${serverData.code}`}
      target="_blank"
      rel="noopener noreferrer"
      className="w-72 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg p-3 shadow-lg transition-all duration-300 hover:shadow-white/10 hover:border-white/20 cursor-pointer group"
    >
      <div className="flex items-center gap-2">
        {/* Ícone do Servidor */}
        <div className="flex-shrink-0">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt={serverData.guild.name}
              className="w-10 h-10 rounded-lg"
            />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              {serverData.guild.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Informações */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-purple-400 transition-colors">
            {serverData.guild.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-white/70">
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="whitespace-nowrap">{formatNumber(serverData.approximate_member_count)}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="whitespace-nowrap">{formatNumber(serverData.approximate_presence_count)} online</span>
            </div>
          </div>
        </div>

        {/* Seta */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </a>
  );
}

