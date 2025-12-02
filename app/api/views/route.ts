import { NextResponse } from "next/server";
import Redis from "ioredis";

// Chave para armazenar views no Redis
const VIEWS_KEY = "site:views";

// Cria conexão Redis
let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL não configurada");
    }
    redis = new Redis(redisUrl);
  }
  return redis;
}

// Rate limit: 2 views por minuto por IP
const RATE_LIMIT_VIEWS = 2;
const RATE_LIMIT_WINDOW = 60; // 1 minuto em segundos (para TTL do Redis)

function getClientIP(request: Request): string {
  // Tenta pegar o IP de vários headers comuns
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  
  // Fallback para um IP padrão (não ideal, mas funciona)
  return "unknown";
}

async function checkRateLimit(ip: string): Promise<boolean> {
  try {
    const redisClient = getRedis();
    const rateLimitKey = `rate_limit:views:${ip}`;
    
    // Pega o contador atual
    const currentCount = await redisClient.get(rateLimitKey);
    
    if (!currentCount) {
      // Primeira requisição deste IP, cria a chave com TTL de 1 minuto
      await redisClient.setex(rateLimitKey, RATE_LIMIT_WINDOW, "1");
      return true;
    }
    
    const count = parseInt(currentCount, 10);
    
    if (count >= RATE_LIMIT_VIEWS) {
      // Limite atingido
      return false;
    }
    
    // Incrementa o contador e renova o TTL
    const newCount = await redisClient.incr(rateLimitKey);
    // Renova o TTL para garantir que a janela de 1 minuto seja mantida
    await redisClient.expire(rateLimitKey, RATE_LIMIT_WINDOW);
    return true;
  } catch (error) {
    console.error("Erro ao verificar rate limit:", error);
    // Em caso de erro, permite a requisição (fail open)
    return true;
  }
}

async function getViews(): Promise<number> {
  try {
    const redisClient = getRedis();
    const views = await redisClient.get(VIEWS_KEY);
    return views ? parseInt(views, 10) : 0;
  } catch (error) {
    console.error("Erro ao buscar views do Redis:", error);
    return 0;
  }
}

async function incrementViews(): Promise<number> {
  try {
    const redisClient = getRedis();
    const newViews = await redisClient.incr(VIEWS_KEY);
    return newViews;
  } catch (error) {
    console.error("Erro ao incrementar views no Redis:", error);
    // Fallback: tenta buscar o valor atual
    return await getViews();
  }
}

export async function GET() {
  try {
    const views = await getViews();
    return NextResponse.json({ views }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error("Erro ao buscar views:", error);
    return NextResponse.json({ views: 0 }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request);
    
    // Verifica rate limit (agora é async)
    const allowed = await checkRateLimit(ip);
    
    const cacheHeaders = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };
    
    if (!allowed) {
      // Retorna o número atual de views sem incrementar
      const views = await getViews();
      return NextResponse.json({ 
        views,
        rateLimited: true,
        message: "Rate limit excedido. Máximo de 2 views por minuto."
      }, { 
        status: 429,
        headers: cacheHeaders
      });
    }
    
    // Incrementa views
    const views = await incrementViews();
    return NextResponse.json({ views, rateLimited: false }, {
      headers: cacheHeaders
    });
  } catch (error) {
    console.error("Erro ao processar POST de views:", error);
    const views = await getViews();
    return NextResponse.json({ views, rateLimited: false }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }
}

