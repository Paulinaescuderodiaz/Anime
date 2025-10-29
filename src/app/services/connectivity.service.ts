import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { timeout, catchError, retry } from 'rxjs/operators';

/**
 * SERVICIO DE CONECTIVIDAD
 * 
 * Este servicio maneja la conectividad con APIs externas y proporciona
 * información detallada sobre el estado de la conexión.
 */
@Injectable({
  providedIn: 'root'
})
export class ConnectivityService {
  
  private readonly API_ENDPOINTS = [
    {
      name: 'AniList (GraphQL)',
      url: 'https://graphql.anilist.co',
      testQuery: {
        query: '{ Page(page: 1, perPage: 1) { media(type: ANIME) { id title { romaji } } } }'
      },
      timeout: 5000
    },
    {
      name: 'Jikan (REST)',
      url: 'https://api.jikan.moe/v4/top/anime?limit=1',
      testQuery: null,
      timeout: 5000
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * PROBAR CONECTIVIDAD CON TODAS LAS APIs
   */
  async testAllConnectivity(): Promise<{
    isConnected: boolean;
    availableApis: string[];
    unavailableApis: string[];
    recommendedApi: string;
    details: any[];
  }> {
    const results: any[] = [];
    const availableApis: string[] = [];
    const unavailableApis: string[] = [];

    for (const api of this.API_ENDPOINTS) {
      try {
        const result = await this.testApiConnectivity(api);
        results.push(result);
        
        if (result.isAvailable) {
          availableApis.push(api.name);
        } else {
          unavailableApis.push(api.name);
        }
      } catch (error) {
        results.push({
          name: api.name,
          isAvailable: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
          responseTime: 0
        });
        unavailableApis.push(api.name);
      }
    }

    const isConnected = availableApis.length > 0;
    const recommendedApi = this.getRecommendedApi(results);

    return {
      isConnected,
      availableApis,
      unavailableApis,
      recommendedApi,
      details: results
    };
  }

  /**
   * PROBAR CONECTIVIDAD CON UNA API ESPECÍFICA
   */
  private async testApiConnectivity(api: any): Promise<{
    name: string;
    isAvailable: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (api.testQuery) {
        // GraphQL request
        response = await this.http.post(api.url, api.testQuery, {
          headers: { 'Content-Type': 'application/json' }
        }).pipe(
          timeout(api.timeout),
          retry(1),
          catchError(() => of(null))
        ).toPromise();
      } else {
        // REST request
        response = await this.http.get(api.url).pipe(
          timeout(api.timeout),
          retry(1),
          catchError(() => of(null))
        ).toPromise();
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: api.name,
        isAvailable: response !== null,
        responseTime,
        error: response === null ? 'Sin respuesta' : undefined
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: api.name,
        isAvailable: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * OBTENER API RECOMENDADA
   */
  private getRecommendedApi(results: any[]): string {
    const available = results.filter(result => result.isAvailable);
    
    if (available.length === 0) {
      return 'Datos de ejemplo (ninguna API disponible)';
    }
    
    // Ordenar por tiempo de respuesta
    const sorted = available.sort((a, b) => a.responseTime - b.responseTime);
    
    return sorted[0].name;
  }

  /**
   * VERIFICAR CONECTIVIDAD BÁSICA
   */
  async checkBasicConnectivity(): Promise<boolean> {
    try {
      const response = await this.http.get('https://httpbin.org/status/200').pipe(
        timeout(3000),
        catchError(() => of(null))
      ).toPromise();
      
      return response !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * GENERAR MENSAJE DE ESTADO
   */
  generateStatusMessage(connectivityResult: any): string {
    if (connectivityResult.isConnected) {
      return `✅ Conectado a ${connectivityResult.availableApis.join(', ')}`;
    } else {
      return '❌ Sin conexión a internet o APIs no disponibles. Usando datos de ejemplo.';
    }
  }
}

