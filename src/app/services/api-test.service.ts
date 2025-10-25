import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';

/**
 * SERVICIO DE PRUEBA DE APIs
 * 
 * Este servicio prueba la conectividad con diferentes APIs de animes
 * y proporciona información sobre cuáles están disponibles.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiTestService {
  
  private readonly API_ENDPOINTS = [
    {
      name: 'AniList (GraphQL)',
      url: 'https://graphql.anilist.co',
      testQuery: {
        query: '{ Page(page: 1, perPage: 1) { media(type: ANIME) { id title { romaji } } } }'
      }
    },
    {
      name: 'Jikan (REST)',
      url: 'https://api.jikan.moe/v4/top/anime?limit=1',
      testQuery: null
    },
    {
      name: 'Kitsu (REST)',
      url: 'https://kitsu.io/api/edge/anime?page[limit]=1',
      testQuery: null
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * PROBAR TODAS LAS APIs
   * 
   * Prueba la conectividad con todas las APIs disponibles.
   */
  async testAllApis(): Promise<{
    available: string[];
    unavailable: string[];
    results: any[];
  }> {
    const results: any[] = [];
    const available: string[] = [];
    const unavailable: string[] = [];

    for (const api of this.API_ENDPOINTS) {
      try {
        const result = await this.testApi(api);
        results.push(result);
        
        if (result.available) {
          available.push(api.name);
        } else {
          unavailable.push(api.name);
        }
      } catch (error) {
        results.push({
          name: api.name,
          available: false,
          error: error,
          responseTime: 0
        });
        unavailable.push(api.name);
      }
    }

    return {
      available,
      unavailable,
      results
    };
  }

  /**
   * PROBAR UNA API ESPECÍFICA
   */
  private async testApi(api: any): Promise<{
    name: string;
    available: boolean;
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
          timeout(5000),
          catchError(() => of(null))
        ).toPromise();
      } else {
        // REST request
        response = await this.http.get(api.url).pipe(
          timeout(5000),
          catchError(() => of(null))
        ).toPromise();
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        name: api.name,
        available: response !== null,
        responseTime,
        error: response === null ? 'Sin respuesta' : undefined
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        name: api.name,
        available: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * OBTENER RECOMENDACIÓN DE API
   * 
   * Recomienda la mejor API basada en los resultados de las pruebas.
   */
  getRecommendedApi(testResults: any[]): string {
    // Buscar la API más rápida y disponible
    const available = testResults.filter(result => result.available);
    
    if (available.length === 0) {
      return 'Datos de ejemplo (ninguna API disponible)';
    }
    
    // Ordenar por tiempo de respuesta
    const sorted = available.sort((a, b) => a.responseTime - b.responseTime);
    
    return sorted[0].name;
  }

  /**
   * GENERAR REPORTE DE CONECTIVIDAD
   */
  generateConnectivityReport(testResults: any[]): string {
    let report = '=== REPORTE DE CONECTIVIDAD ===\n\n';
    
    testResults.forEach(result => {
      report += `📡 ${result.name}:\n`;
      report += `   Estado: ${result.available ? '✅ Disponible' : '❌ No disponible'}\n`;
      report += `   Tiempo: ${result.responseTime}ms\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      report += '\n';
    });
    
    const available = testResults.filter(r => r.available);
    const unavailable = testResults.filter(r => !r.available);
    
    report += `📊 RESUMEN:\n`;
    report += `   APIs disponibles: ${available.length}/${testResults.length}\n`;
    report += `   APIs no disponibles: ${unavailable.length}/${testResults.length}\n`;
    
    if (available.length > 0) {
      const fastest = available.sort((a, b) => a.responseTime - b.responseTime)[0];
      report += `   Recomendación: ${fastest.name} (${fastest.responseTime}ms)\n`;
    } else {
      report += `   Recomendación: Usar datos de ejemplo\n`;
    }
    
    return report;
  }
}
