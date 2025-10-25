/**
 * UTILIDADES DE PRUEBA DE CONECTIVIDAD
 * 
 * Este archivo contiene funciones para probar la conectividad con la API
 * y diagnosticar problemas de conexión.
 */

export class ConnectivityTest {
  
  /**
   * PROBAR CONECTIVIDAD CON LA API
   * 
   * Prueba si la API de Jikan está disponible y responde correctamente.
   */
  static async testApiConnectivity(): Promise<{
    isConnected: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch('https://api.jikan.moe/v4/top/anime?limit=1', {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          isConnected: true,
          responseTime
        };
      } else {
        return {
          isConnected: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isConnected: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
  
  /**
   * DIAGNOSTICAR PROBLEMAS DE CONECTIVIDAD
   * 
   * Proporciona un diagnóstico detallado de los problemas de conectividad.
   */
  static async diagnoseConnectivity(): Promise<{
    internetConnection: boolean;
    apiAccessible: boolean;
    dnsResolution: boolean;
    firewallBlocked: boolean;
    suggestions: string[];
  }> {
    const suggestions: string[] = [];
    
    // Probar conexión a internet básica
    const internetTest = await this.testBasicInternet();
    
    // Probar acceso a la API
    const apiTest = await this.testApiConnectivity();
    
    // Probar resolución DNS
    const dnsTest = await this.testDnsResolution();
    
    // Generar sugerencias basadas en los resultados
    if (!internetTest) {
      suggestions.push('Verifica tu conexión a internet');
      suggestions.push('Revisa la configuración de tu router/módem');
    }
    
    if (!dnsTest) {
      suggestions.push('Problema con la resolución DNS');
      suggestions.push('Intenta cambiar a DNS público (8.8.8.8, 1.1.1.1)');
    }
    
    if (internetTest && !apiTest.isConnected) {
      suggestions.push('La API de Jikan puede estar temporalmente fuera de servicio');
      suggestions.push('Intenta más tarde o usa datos de ejemplo');
    }
    
    if (apiTest.responseTime > 5000) {
      suggestions.push('La conexión es lenta, considera usar datos de ejemplo');
    }
    
    return {
      internetConnection: internetTest,
      apiAccessible: apiTest.isConnected,
      dnsResolution: dnsTest,
      firewallBlocked: internetTest && !apiTest.isConnected,
      suggestions
    };
  }
  
  /**
   * PROBAR CONEXIÓN BÁSICA A INTERNET
   */
  private static async testBasicInternet(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * PROBAR RESOLUCIÓN DNS
   */
  private static async testDnsResolution(): Promise<boolean> {
    try {
      const response = await fetch('https://api.jikan.moe', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      return true;
    } catch {
      return false;
    }
  }
}
