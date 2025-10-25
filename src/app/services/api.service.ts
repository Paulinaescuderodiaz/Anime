import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

/**
 * INTERFAZ PARA ANIME
 * 
 * Define la estructura de datos para los animes obtenidos de la API:
 * - id: Identificador único del anime
 * - title: Título del anime
 * - description: Descripción/sinopsis
 * - image: URL de la imagen del anime
 * - rating: Calificación promedio
 * - genres: Array de géneros
 * - year: Año de lanzamiento
 * - status: Estado (en emisión, finalizado, etc.)
 */
export interface Anime {
  id: number;
  title: string;
  description: string;
  image: string;
  rating: number;
  genres: string[];
  year: number;
  status: string;
}

/**
 * INTERFAZ PARA RESPUESTA DE API
 * 
 * Define la estructura de la respuesta de la API de Jikan:
 * - data: Array de animes
 * - pagination: Información de paginación
 */
export interface AnimeResponse {
  data: Anime[];
  pagination: {
    last_visible_page: number;
    has_next_page: boolean;
    current_page: number;
    items: {
      count: number;
      total: number;
      per_page: number;
    };
  };
}

/**
 * SERVICIO DE API EXTERNA
 * 
 * Este servicio se conecta con la API de Jikan (MyAnimeList) para obtener:
 * - Lista de animes populares
 * - Búsqueda de animes por nombre
 * - Detalles específicos de animes
 * - Animes por género
 * - Animes de la temporada actual
 * 
 * La API de Jikan es gratuita y no requiere autenticación.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  // URL base de la API de AniList (más confiable y estable)
  private baseUrl = 'https://graphql.anilist.co';

  constructor(private http: HttpClient) {}

  /**
   * MANEJO DE ERRORES HTTP
   * 
   * Maneja los errores de conexión con la API y proporciona mensajes informativos.
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error de conexión: ${error.error.message}`;
    } else {
      // Error del servidor
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
  }

  /**
   * OBTENER ANIMES POPULARES
   * 
   * Obtiene la lista de animes más populares/mejor valorados
   * desde la API de Jikan.
   * 
   * @returns Observable<AnimeResponse> - Lista de animes populares
   */
  getTopAnimes(): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/top/anime`)
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(this.handleError)
      );
  }

  /**
   * BUSCAR ANIMES POR NOMBRE
   * 
   * Busca animes que coincidan con el término de búsqueda.
   * 
   * @param query - Término de búsqueda
   * @returns Observable<AnimeResponse> - Lista de animes encontrados
   */
  searchAnimes(query: string): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/anime?q=${encodeURIComponent(query)}`)
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(this.handleError)
      );
  }

  /**
   * OBTENER DETALLES DE UN ANIME ESPECÍFICO
   * 
   * Obtiene información detallada de un anime por su ID.
   * 
   * @param id - ID del anime
   * @returns Observable<any> - Detalles completos del anime
   */
  getAnimeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/anime/${id}`)
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(this.handleError)
      );
  }

  /**
   * OBTENER ANIMES POR GÉNERO
   * 
   * Filtra animes por un género específico.
   * 
   * @param genre - Género a filtrar
   * @returns Observable<AnimeResponse> - Lista de animes del género
   */
  getAnimesByGenre(genre: string): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/anime?genres=${genre}`)
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(this.handleError)
      );
  }

  /**
   * OBTENER ANIMES DE TEMPORADA ACTUAL
   * 
   * Obtiene los animes que están actualmente en emisión.
   * 
   * @returns Observable<AnimeResponse> - Lista de animes de la temporada actual
   */
  getCurrentSeasonAnimes(): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/seasons/now`)
      .pipe(
        timeout(10000), // Timeout de 10 segundos
        catchError(this.handleError)
      );
  }
}
