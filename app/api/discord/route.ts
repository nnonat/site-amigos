import { NextResponse } from "next/server";

// Desabilita cache da rota
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const userId = process.env.DISCORD_USER_ID;

    // Verifica se a variável de ambiente está configurada
    if (!userId) {
      console.error('Variável de ambiente DISCORD_USER_ID não configurada');
      return NextResponse.json(
        { error: 'Variável de ambiente DISCORD_USER_ID não configurada' },
        { status: 500 }
      );
    }

    // Headers para a API externa
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Faz requisição para a API externa com timestamp para evitar cache
    const timestamp = Date.now();
    const url = `https://riexpresenceapi.squareweb.app/user/${userId}?t=${timestamp}`;
    const profileReq = await fetch(url, { 
      headers: {
        ...headers,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    // Verifica se a requisição foi bem-sucedida
    if (!profileReq.ok) {
      const errorText = await profileReq.text();
      console.error('Erro na API externa:', profileReq.status, errorText);
      return NextResponse.json(
        { error: 'Erro ao buscar dados da API', status: profileReq.status, details: errorText },
        { status: profileReq.status }
      );
    }

    const data = await profileReq.json();

    // A API externa pode retornar os dados em formato diferente
    // Ajusta para manter compatibilidade com o formato esperado
    const user = data.user || data;
    const globalName = user?.global_name || user?.globalName || null;
    const bio = data.user_profile?.bio || data.bio || null;
    const connectedAccounts = data.connected_accounts || data.connectedAccounts || [];
    const badges = data.badges || [];
    const presence = data.presence || null;

    return NextResponse.json(
      { user, bio, globalName, presence, badges, connectedAccounts },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
