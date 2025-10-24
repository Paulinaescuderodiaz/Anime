import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private baseUrl = 'https://api.jikan.moe/v4';

  constructor(private http: HttpClient) {}

  // Obtener animes populares
  getTopAnimes(): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/top/anime`);
  }

  // Buscar animes por nombre
  searchAnimes(query: string): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/anime?q=${encodeURIComponent(query)}`);
  }

  // Obtener detalles de un anime específico
  getAnimeById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/anime/${id}`);
  }

  // Obtener animes por género
  getAnimesByGenre(genre: string): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/anime?genres=${genre}`);
  }

  // Obtener animes de temporada actual
  getCurrentSeasonAnimes(): Observable<AnimeResponse> {
    return this.http.get<AnimeResponse>(`${this.baseUrl}/seasons/now`);
  }
}
