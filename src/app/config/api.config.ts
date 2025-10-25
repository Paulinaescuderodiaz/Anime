/**
 * CONFIGURACIÓN DE LA API
 * 
 * Este archivo contiene la configuración para la conexión con la API de Jikan.
 * Incluye URLs, timeouts y configuraciones de reintentos.
 */
export const API_CONFIG = {
  // URL base de la API de Jikan
  BASE_URL: 'https://api.jikan.moe/v4',
  
  // URLs alternativas en caso de fallo
  FALLBACK_URLS: [
    'https://api.jikan.moe/v3',
    'https://api.jikan.moe/v4'
  ],
  
  // Configuración de timeouts
  TIMEOUT: 10000, // 10 segundos
  
  // Configuración de reintentos
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 segundo
  
  // Headers por defecto
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Configuración de rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 3600
  }
};

/**
 * CONFIGURACIÓN DE DATOS DE EJEMPLO
 * 
 * Configuración para el servicio de datos de ejemplo.
 */
export const FALLBACK_CONFIG = {
  // Habilitar datos de ejemplo cuando la API falla
  ENABLE_FALLBACK: true,
  
  // Mostrar mensaje cuando se usan datos de ejemplo
  SHOW_FALLBACK_MESSAGE: true,
  
  // Número máximo de animes de ejemplo
  MAX_SAMPLE_ANIMES: 10
};
