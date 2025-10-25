import { Injectable } from '@angular/core';
import { Anime } from './api.service';

/**
 * SERVICIO DE DATOS DE EJEMPLO
 * 
 * Este servicio proporciona datos de ejemplo cuando la API externa no está disponible.
 * Incluye animes populares y datos de prueba para demostrar la funcionalidad.
 */
@Injectable({
  providedIn: 'root'
})
export class FallbackDataService {
  
  /**
   * OBTENER ANIMES DE EJEMPLO
   * 
   * Devuelve una lista de animes populares de ejemplo cuando la API no está disponible.
   */
  getSampleAnimes(): Anime[] {
    return [
      {
        id: 1,
        title: 'Attack on Titan',
        description: 'La humanidad vive en ciudades rodeadas por enormes muros que los protegen de los titanes, gigantes humanoides que devoran a los humanos sin razón aparente.',
        image: 'https://via.placeholder.com/300x400/ff6b6b/ffffff?text=Attack+on+Titan',
        rating: 9.0,
        genres: ['Acción', 'Drama', 'Fantasía'],
        year: 2013,
        status: 'Finalizado'
      },
      {
        id: 2,
        title: 'Demon Slayer',
        description: 'Tanjiro Kamado es un joven que se convierte en cazador de demonios después de que su familia es asesinada y su hermana se convierte en demonio.',
        image: 'https://via.placeholder.com/300x400/4ecdc4/ffffff?text=Demon+Slayer',
        rating: 8.7,
        genres: ['Acción', 'Supernatural', 'Histórico'],
        year: 2019,
        status: 'Finalizado'
      },
      {
        id: 3,
        title: 'One Piece',
        description: 'Monkey D. Luffy es un joven que sueña con convertirse en el Rey de los Piratas. Junto a su tripulación, navega por el Grand Line en busca del tesoro más grande del mundo.',
        image: 'https://via.placeholder.com/300x400/45b7d1/ffffff?text=One+Piece',
        rating: 9.2,
        genres: ['Aventura', 'Comedia', 'Shounen'],
        year: 1999,
        status: 'En emisión'
      },
      {
        id: 4,
        title: 'Naruto',
        description: 'Naruto Uzumaki es un ninja adolescente que sueña con convertirse en Hokage, el líder de su aldea. Debe superar muchos obstáculos y hacer amigos en el camino.',
        image: 'https://via.placeholder.com/300x400/ffa726/ffffff?text=Naruto',
        rating: 8.3,
        genres: ['Acción', 'Aventura', 'Shounen'],
        year: 2002,
        status: 'Finalizado'
      },
      {
        id: 5,
        title: 'My Hero Academia',
        description: 'En un mundo donde la mayoría de las personas tienen superpoderes, Izuku Midoriya sueña con convertirse en un héroe a pesar de no tener poderes.',
        image: 'https://via.placeholder.com/300x400/66bb6a/ffffff?text=My+Hero+Academia',
        rating: 8.5,
        genres: ['Acción', 'Escolar', 'Shounen'],
        year: 2016,
        status: 'En emisión'
      },
      {
        id: 6,
        title: 'Death Note',
        description: 'Light Yagami encuentra un cuaderno sobrenatural que le permite matar a cualquiera escribiendo su nombre. Decide usarlo para crear un mundo perfecto.',
        image: 'https://via.placeholder.com/300x400/8e24aa/ffffff?text=Death+Note',
        rating: 9.0,
        genres: ['Suspenso', 'Psicológico', 'Sobrenatural'],
        year: 2006,
        status: 'Finalizado'
      },
      {
        id: 7,
        title: 'Fullmetal Alchemist: Brotherhood',
        description: 'Los hermanos Edward y Alphonse Elric buscan la Piedra Filosofal para restaurar sus cuerpos después de un experimento de alquimia fallido.',
        image: 'https://via.placeholder.com/300x400/ff7043/ffffff?text=Fullmetal+Alchemist',
        rating: 9.5,
        genres: ['Aventura', 'Drama', 'Fantasía'],
        year: 2009,
        status: 'Finalizado'
      },
      {
        id: 8,
        title: 'Spirited Away',
        description: 'Chihiro, una niña de 10 años, se encuentra en un mundo de espíritus donde debe trabajar para liberar a sus padres y regresar al mundo humano.',
        image: 'https://via.placeholder.com/300x400/26a69a/ffffff?text=Spirited+Away',
        rating: 8.6,
        genres: ['Aventura', 'Fantasía', 'Familia'],
        year: 2001,
        status: 'Finalizado'
      },
      {
        id: 9,
        title: 'Dragon Ball Z',
        description: 'Goku y sus amigos protegen la Tierra de villanos poderosos mientras entrenan para volverse más fuertes y dominar nuevas técnicas de combate.',
        image: 'https://via.placeholder.com/300x400/ff5722/ffffff?text=Dragon+Ball+Z',
        rating: 8.2,
        genres: ['Acción', 'Aventura', 'Shounen'],
        year: 1989,
        status: 'Finalizado'
      },
      {
        id: 10,
        title: 'Studio Ghibli Collection',
        description: 'Una colección de las mejores películas de Studio Ghibli, incluyendo obras maestras como El Viaje de Chihiro, El Castillo Vagabundo y Mi Vecino Totoro.',
        image: 'https://via.placeholder.com/300x400/795548/ffffff?text=Studio+Ghibli',
        rating: 9.1,
        genres: ['Fantasía', 'Aventura', 'Familia'],
        year: 1985,
        status: 'En emisión'
      }
    ];
  }

  /**
   * BUSCAR ANIMES DE EJEMPLO
   * 
   * Busca animes de ejemplo que coincidan con el término de búsqueda.
   */
  searchSampleAnimes(query: string): Anime[] {
    const allAnimes = this.getSampleAnimes();
    const searchTerm = query.toLowerCase();
    
    return allAnimes.filter(anime => 
      anime.title.toLowerCase().includes(searchTerm) ||
      anime.genres.some(genre => genre.toLowerCase().includes(searchTerm)) ||
      anime.description.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * OBTENER ANIME DE EJEMPLO POR ID
   * 
   * Devuelve un anime específico de ejemplo por su ID.
   */
  getSampleAnimeById(id: number): Anime | null {
    const animes = this.getSampleAnimes();
    return animes.find(anime => anime.id === id) || null;
  }
}
