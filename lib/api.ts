/**
 * Retorna a URL base da API
 * No servidor: usa process.env.API_URL
 * No cliente: usa process.env.NEXT_PUBLIC_API_URL
 */
export function getApiUrl(): string {
  // No servidor (Node.js)
  if (typeof window === 'undefined') {
    return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://riexpresenceapi.squareweb.app';
  }
  
  // No cliente (browser)
  return process.env.NEXT_PUBLIC_API_URL || 'https://riexpresenceapi.squareweb.app';
}

