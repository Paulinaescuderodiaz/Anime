import { Injectable } from '@angular/core';
import { DatabaseService } from './database';

export interface Review {
  id?: number;
  usuarioId: number;
  animeId: number;
  calificacion: number;
  comentario: string;
  fecha?: string;
  nombreUsuario?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  constructor(private databaseService: DatabaseService) {}

  // Crear una nueva reseña
  async createReview(review: Omit<Review, 'id' | 'fecha'>): Promise<boolean> {
    try {
      await this.databaseService.agregarReseña(
        review.usuarioId,
        review.animeId,
        review.calificacion,
        review.comentario
      );
      return true;
    } catch (error) {
      console.error('Error creando reseña:', error);
      return false;
    }
  }

  // Obtener reseñas de un anime específico
  async getReviewsByAnime(animeId: number): Promise<Review[]> {
    try {
      return await this.databaseService.obtenerReseñas(animeId);
    } catch (error) {
      console.error('Error obteniendo reseñas:', error);
      return [];
    }
  }

  // Obtener reseñas de un usuario específico
  async getReviewsByUser(userId: number): Promise<Review[]> {
    try {
      return await this.databaseService.obtenerReseñasPorUsuario(userId);
    } catch (error) {
      console.error('Error obteniendo reseñas del usuario:', error);
      return [];
    }
  }

  // Actualizar una reseña existente
  async updateReview(reviewId: number, review: Partial<Review>): Promise<boolean> {
    try {
      await this.databaseService.actualizarReseña(reviewId, review);
      return true;
    } catch (error) {
      console.error('Error actualizando reseña:', error);
      return false;
    }
  }

  // Eliminar una reseña
  async deleteReview(reviewId: number): Promise<boolean> {
    try {
      await this.databaseService.eliminarReseña(reviewId);
      return true;
    } catch (error) {
      console.error('Error eliminando reseña:', error);
      return false;
    }
  }

  // Obtener calificación promedio de un anime
  async getAverageRating(animeId: number): Promise<number> {
    try {
      return await this.databaseService.obtenerCalificacionPromedio(animeId);
    } catch (error) {
      console.error('Error obteniendo calificación promedio:', error);
      return 0;
    }
  }

  // Verificar si un usuario ya reseñó un anime
  async hasUserReviewedAnime(userId: number, animeId: number): Promise<boolean> {
    try {
      return await this.databaseService.usuarioYaReseño(userId, animeId);
    } catch (error) {
      console.error('Error verificando reseña:', error);
      return false;
    }
  }
}
