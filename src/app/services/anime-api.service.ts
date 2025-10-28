import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, timeout, retry, switchMap } from 'rxjs/operators';
import { FallbackDataService } from './fallback-data.service';
import { ConnectivityService } from './connectivity.service';

/**
 * INTERFAZ PARA ANIME MEJORADA
 * 
 * Estructura de datos optimizada para animes con más información.
 */
export interface AnimeData {
  id: number;
  title: string;
  titleEnglish?: string;
  description: string;
  image: string;
  rating: number;
  genres: string[];
  year: number;
  status: string;
  episodes?: number;
  duration?: number;
  studio?: string;
  source?: string;
}

/**
 * SERVICIO DE API DE ANIMES CON MÚLTIPLES FUENTES
 * 
 * Este servicio intenta conectar con múltiples APIs de animes:
 * 1. AniList (GraphQL) - Principal
 * 2. Jikan (REST) - Secundaria
 * 3. Datos de ejemplo - Fallback
 */
@Injectable({
  providedIn: 'root'
})
export class AnimeApiService {
  
  // URLs de diferentes APIs
  private readonly API_URLS = {
    anilist: 'https://graphql.anilist.co',
    jikan: 'https://api.jikan.moe/v4',
    kitsu: 'https://kitsu.io/api/edge'
  };

  constructor(
    private http: HttpClient,
    private fallbackDataService: FallbackDataService,
    private connectivityService: ConnectivityService
  ) {}

  /**
   * OBTENER ANIMES POPULARES
   * 
   * Intenta obtener animes populares de múltiples fuentes.
   */
  async getTopAnimes(): Promise<AnimeData[]> {
    // Verificar conectividad primero
    const connectivityResult = await this.connectivityService.testAllConnectivity();
    
    if (!connectivityResult.isConnected) {
      console.warn('Sin conectividad detectada, usando datos de ejemplo');
      return this.fallbackDataService.getSampleAnimes();
    }

    // Intentar obtener datos de APIs disponibles
    const result = await this.tryMultipleSources([
      () => this.getAnimesFromAniList(),
      () => this.getAnimesFromJikan(),
      () => of(this.fallbackDataService.getSampleAnimes())
    ]).toPromise();
    
    return result || this.fallbackDataService.getSampleAnimes();
  }

  /**
   * BUSCAR ANIMES
   * 
   * Busca animes en múltiples fuentes.
   */
  async searchAnimes(query: string): Promise<AnimeData[]> {
    // Verificar conectividad primero
    const connectivityResult = await this.connectivityService.testAllConnectivity();
    
    if (!connectivityResult.isConnected) {
      console.warn('Sin conectividad detectada, usando búsqueda en datos de ejemplo');
      return this.fallbackDataService.searchSampleAnimes(query);
    }

    // Intentar buscar en APIs disponibles
    const result = await this.tryMultipleSources([
      () => this.searchAnimesFromAniList(query),
      () => this.searchAnimesFromJikan(query),
      () => of(this.fallbackDataService.searchSampleAnimes(query))
    ]).toPromise();
    
    return result || this.fallbackDataService.searchSampleAnimes(query);
  }

  /**
   * OBTENER DETALLES DE ANIME
   * 
   * Obtiene detalles específicos de un anime.
   */
  getAnimeById(id: number): Observable<AnimeData | null> {
    return this.tryMultipleSources([
      () => this.getAnimeFromAniList(id),
      () => this.getAnimeFromJikan(id),
      () => of(this.fallbackDataService.getSampleAnimeById(id))
    ]);
  }

  /**
   * INTENTAR MÚLTIPLES FUENTES
   * 
   * Intenta obtener datos de múltiples fuentes hasta que una funcione.
   */
  private tryMultipleSources<T>(sources: (() => Observable<T>)[]): Observable<T> {
    let currentIndex = 0;
    
    const tryNext = (): Observable<T> => {
      if (currentIndex >= sources.length) {
        return throwError(() => new Error('Todas las fuentes fallaron'));
      }
      
      return sources[currentIndex]().pipe(
        catchError((error) => {
          console.warn(`Fuente ${currentIndex + 1} falló:`, error);
          currentIndex++;
          return tryNext();
        })
      );
    };
    
    return tryNext();
  }

  /**
   * OBTENER ANIMES DESDE ANILIST (GraphQL)
   */
  private getAnimesFromAniList(): Observable<AnimeData[]> {
    const query = `
      query {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            averageScore
            genres
            startDate {
              year
            }
            status
            episodes
            duration
            studios {
              nodes {
                name
              }
            }
            source
          }
        }
      }
    `;

    return this.http.post<any>(this.API_URLS.anilist, { query }).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const animes = response.data?.Page?.media || [];
        return of(this.transformAniListData(animes));
      })
    );
  }

  /**
   * BUSCAR ANIMES DESDE ANILIST
   */
  private searchAnimesFromAniList(query: string): Observable<AnimeData[]> {
    const searchQuery = `
      query($search: String) {
        Page(page: 1, perPage: 10) {
          media(type: ANIME, search: $search, sort: POPULARITY_DESC) {
            id
            title {
              romaji
              english
            }
            description
            coverImage {
              large
            }
            averageScore
            genres
            startDate {
              year
            }
            status
            episodes
            duration
            studios {
              nodes {
                name
              }
            }
            source
          }
        }
      }
    `;

    return this.http.post<any>(this.API_URLS.anilist, { 
      query: searchQuery, 
      variables: { search: query } 
    }).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const animes = response.data?.Page?.media || [];
        return of(this.transformAniListData(animes));
      })
    );
  }

  /**
   * OBTENER ANIME DESDE ANILIST
   */
  private getAnimeFromAniList(id: number): Observable<AnimeData | null> {
    const query = `
      query($id: Int) {
        Media(id: $id) {
          id
          title {
            romaji
            english
          }
          description
          coverImage {
            large
          }
          averageScore
          genres
          startDate {
            year
          }
          status
          episodes
          duration
          studios {
            nodes {
              name
            }
          }
          source
        }
      }
    `;

    return this.http.post<any>(this.API_URLS.anilist, { 
      query, 
      variables: { id } 
    }).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const anime = response.data?.Media;
        return of(anime ? this.transformAniListAnime(anime) : null);
      })
    );
  }

  /**
   * OBTENER ANIMES DESDE JIKAN (REST)
   */
  private getAnimesFromJikan(): Observable<AnimeData[]> {
    return this.http.get<any>(`${this.API_URLS.jikan}/top/anime`).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const animes = response.data || [];
        return of(this.transformJikanData(animes));
      })
    );
  }

  /**
   * BUSCAR ANIMES DESDE JIKAN
   */
  private searchAnimesFromJikan(query: string): Observable<AnimeData[]> {
    return this.http.get<any>(`${this.API_URLS.jikan}/anime?q=${encodeURIComponent(query)}`).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const animes = response.data || [];
        return of(this.transformJikanData(animes));
      })
    );
  }

  /**
   * OBTENER ANIME DESDE JIKAN
   */
  private getAnimeFromJikan(id: number): Observable<AnimeData | null> {
    return this.http.get<any>(`${this.API_URLS.jikan}/anime/${id}`).pipe(
      timeout(8000),
      retry(2),
      catchError(this.handleError),
      switchMap((response) => {
        const anime = response.data;
        return of(anime ? this.transformJikanAnime(anime) : null);
      })
    );
  }

  /**
   * TRANSFORMAR DATOS DE ANILIST
   */
  private transformAniListData(animes: any[]): AnimeData[] {
    return animes.map(anime => this.transformAniListAnime(anime));
  }

  private transformAniListAnime(anime: any): AnimeData {
    return {
      id: anime.id,
      title: anime.title.romaji || anime.title.english || 'Sin título',
      titleEnglish: anime.title.english,
      description: this.cleanDescription(anime.description),
      image: anime.coverImage?.large || 'https://via.placeholder.com/300x400/667eea/ffffff?text=No+Image',
      rating: anime.averageScore ? anime.averageScore / 10 : 0,
      genres: anime.genres || [],
      year: anime.startDate?.year || 0,
      status: this.mapStatus(anime.status),
      episodes: anime.episodes,
      duration: anime.duration,
      studio: anime.studios?.nodes?.[0]?.name,
      source: anime.source
    };
  }

  /**
   * TRANSFORMAR DATOS DE JIKAN
   */
  private transformJikanData(animes: any[]): AnimeData[] {
    return animes.map(anime => this.transformJikanAnime(anime));
  }

  private transformJikanAnime(anime: any): AnimeData {
    return {
      id: anime.mal_id || anime.id,
      title: anime.title || 'Sin título',
      titleEnglish: anime.title_english,
      description: this.cleanDescription(anime.synopsis),
      image: anime.images?.jpg?.large_image_url || anime.images?.webp?.large_image_url || 'https://via.placeholder.com/300x400/667eea/ffffff?text=No+Image',
      rating: anime.score || 0,
      genres: anime.genres?.map((g: any) => g.name) || [],
      year: anime.year || anime.aired?.prop?.from?.year || 0,
      status: this.mapStatus(anime.status),
      episodes: anime.episodes,
      duration: anime.duration,
      studio: anime.studios?.[0]?.name,
      source: anime.source
    };
  }

  /**
   * LIMPIAR DESCRIPCIÓN
   */
  private cleanDescription(description: string): string {
    if (!description) return 'Sin descripción disponible';
    
    // Remover tags HTML y limitar longitud
    return description
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .substring(0, 300) + '...';
  }

  /**
   * MAPEAR ESTADO
   */
  private mapStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'FINISHED': 'Finalizado',
      'RELEASING': 'En emisión',
      'NOT_YET_RELEASED': 'Próximamente',
      'CANCELLED': 'Cancelado',
      'HIATUS': 'En pausa',
      'Currently Airing': 'En emisión',
      'Finished Airing': 'Finalizado',
      'Not yet aired': 'Próximamente'
    };
    
    return statusMap[status] || status || 'Desconocido';
  }

  /**
   * MANEJO DE ERRORES
   */
  private handleError = (error: HttpErrorResponse) => {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Sin conexión a internet';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 429:
          errorMessage = 'Demasiadas solicitudes. Intenta más tarde';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status}`;
      }
    }
    
    console.error('Error en API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  };
}
