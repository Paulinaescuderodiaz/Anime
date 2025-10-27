import { Injectable } from '@angular/core';
import { DatabaseService } from './database';

/**
 * ===================================================================================
 * INTERFAZ DE RESEÑA - Review
 * ===================================================================================
 * 
 * DESCRIPCIÓN:
 * Define la estructura de datos para las reseñas de animes en la aplicación.
 * 
 * PROPIEDADES:
 * - id?: ID único de la reseña (opcional, se genera automáticamente)
 * - usuarioId: ID del usuario que hizo la reseña (obligatorio)
 * - animeId: ID del anime reseñado (obligatorio)
 * - calificacion: Calificación numérica del 1 al 5 (obligatorio)
 * - comentario: Comentario de la reseña (obligatorio)
 * - fecha?: Fecha de creación de la reseña (opcional, se genera automáticamente)
 * - nombreUsuario?: Nombre del usuario (opcional, se obtiene del JOIN)
 * 
 * USO TÍPICO:
 * - Crear nuevas reseñas
 * - Actualizar reseñas existentes
 * - Obtener datos de reseñas desde la base de datos
 * 
 * EJEMPLO DE USO:
 * const review: Review = {
 *   usuarioId: 1,
 *   animeId: 123,
 *   calificacion: 5,
 *   comentario: 'Excelente anime!'
 * };
 * 
 * ===================================================================================
 */
export interface Review {
  id?: number;              // ID único de la reseña
  usuarioId: number;        // ID del usuario que hizo la reseña
  animeId: number;          // ID del anime reseñado
  calificacion: number;     // Calificación del 1 al 5
  comentario: string;       // Comentario de la reseña
  fecha?: string;           // Fecha de creación
  nombreUsuario?: string;   // Nombre del usuario (obtenido del JOIN)
}

/**
 * ===================================================================================
 * SERVICIO DE GESTIÓN DE RESEÑAS - ReviewService
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Este servicio actúa como una capa de abstracción entre los componentes de la UI
 * y el DatabaseService para todas las operaciones relacionadas con reseñas.
 * 
 * ARQUITECTURA:
 * - Capa de abstracción sobre DatabaseService
 * - Manejo centralizado de operaciones CRUD de reseñas
 * - Interfaz consistente para todos los componentes
 * - Manejo de errores unificado
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 1. Crear nuevas reseñas
 * 2. Obtener reseñas por anime
 * 3. Obtener reseñas por usuario
 * 4. Actualizar reseñas existentes
 * 5. Eliminar reseñas
 * 6. Calcular calificaciones promedio
 * 7. Verificar si un usuario ya reseñó un anime
 * 
 * INTEGRACIÓN CON OTROS SERVICIOS:
 * - DatabaseService: Para operaciones de base de datos SQLite
 * - AuthService: Para obtener información del usuario actual
 * - AddReviewPage: Para crear nuevas reseñas
 * - HomePage: Para mostrar reseñas en la interfaz
 * - MyReviewsPage: Para gestionar reseñas del usuario
 * 
 * MANEJO DE ERRORES:
 * - Captura errores de base de datos
 * - Retorna valores por defecto en caso de error
 * - Logs detallados para debugging
 * 
 * ===================================================================================
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewService {

  /**
   * =================================================================================
   * CONSTRUCTOR E INYECCIÓN DE DEPENDENCIAS
   * =================================================================================
   */
  constructor(private databaseService: DatabaseService) {}

  /**
   * =================================================================================
   * MÉTODO DE CREACIÓN DE RESEÑAS
   * =================================================================================
   * 
   * FUNCIÓN: createReview()
   * 
   * DESCRIPCIÓN:
   * Crea una nueva reseña en la base de datos SQLite.
   * 
   * PARÁMETROS:
   * @param review - Objeto Review sin id ni fecha (se generan automáticamente)
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si la creación fue exitosa, false si falló
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Validar que el objeto review tenga los campos obligatorios
   * 2. Llamar al DatabaseService para insertar la reseña
   * 3. Manejar errores y retornar resultado
   * 
   * MANEJO DE ERRORES:
   * - Error de base de datos: Retorna false
   * - Logs detallados para debugging
   * 
   * EJEMPLO DE USO:
   * const reviewData = {
   *   usuarioId: 1,
   *   animeId: 123,
   *   calificacion: 5,
   *   comentario: 'Excelente anime!'
   * };
   * const success = await reviewService.createReview(reviewData);
   * 
   * =================================================================================
   */
  async createReview(review: Omit<Review, 'id' | 'fecha'>): Promise<boolean> {
    try {
      console.log('🔄 Creando nueva reseña para anime:', review.animeId);
      
      /**
       * PASO 1: INSERTAR RESEÑA EN BASE DE DATOS
       * Usa el DatabaseService para realizar la inserción
       */
      await this.databaseService.agregarReseña(
        review.usuarioId,
        review.animeId,
        review.calificacion,
        review.comentario
      );
      
      console.log('✅ Reseña creada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error creando reseña:', error);
      return false;
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE OBTENCIÓN DE RESEÑAS POR ANIME
   * =================================================================================
   * 
   * FUNCIÓN: getReviewsByAnime()
   * 
   * DESCRIPCIÓN:
   * Obtiene todas las reseñas de un anime específico con información del usuario.
   * 
   * PARÁMETROS:
   * @param animeId - ID del anime del cual obtener reseñas
   * 
   * RETORNA:
   * @returns Promise<Review[]> - Array de reseñas con datos del usuario
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Llamar al DatabaseService para obtener reseñas
   * 2. Manejar errores y retornar array vacío si falla
   * 3. Retornar array de reseñas con datos del usuario
   * 
   * DATOS INCLUIDOS:
   * - Información completa de la reseña
   * - Nombre del usuario que hizo la reseña
   * - Ordenadas por fecha (más recientes primero)
   * 
   * EJEMPLO DE USO:
   * const reseñas = await reviewService.getReviewsByAnime(123);
   * reseñas.forEach(r => console.log(`${r.nombreUsuario}: ${r.comentario}`));
   * 
   * =================================================================================
   */
  async getReviewsByAnime(animeId: number): Promise<Review[]> {
    try {
      console.log('🔍 Obteniendo reseñas para anime:', animeId);
      
      /**
       * PASO 1: OBTENER RESEÑAS DESDE BASE DE DATOS
       * Usa el DatabaseService para realizar la consulta con JOIN
       */
      const reseñas = await this.databaseService.obtenerReseñas(animeId);
      
      console.log(`✅ Obtenidas ${reseñas.length} reseñas para el anime`);
      return reseñas;
      
    } catch (error) {
      console.error('❌ Error obteniendo reseñas:', error);
      return [];
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE OBTENCIÓN DE RESEÑAS POR USUARIO
   * =================================================================================
   * 
   * FUNCIÓN: getReviewsByUser()
   * 
   * DESCRIPCIÓN:
   * Obtiene todas las reseñas realizadas por un usuario específico.
   * 
   * PARÁMETROS:
   * @param userId - ID del usuario del cual obtener reseñas
   * 
   * RETORNA:
   * @returns Promise<Review[]> - Array de reseñas con datos del anime
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Llamar al DatabaseService para obtener reseñas del usuario
   * 2. Manejar errores y retornar array vacío si falla
   * 3. Retornar array de reseñas con datos del anime
   * 
   * DATOS INCLUIDOS:
   * - Información completa de la reseña
   * - Título del anime reseñado
   * - Ordenadas por fecha (más recientes primero)
   * 
   * USO TÍPICO:
   * - Mostrar reseñas del usuario en "Mis Reseñas"
   * - Permitir editar/eliminar reseñas propias
   * - Generar estadísticas del usuario
   * 
   * EJEMPLO DE USO:
   * const misReseñas = await reviewService.getReviewsByUser(1);
   * misReseñas.forEach(r => console.log(`Reseñé: ${r.animeTitulo}`));
   * 
   * =================================================================================
   */
  async getReviewsByUser(userId: number): Promise<Review[]> {
    try {
      console.log('🔍 Obteniendo reseñas para usuario:', userId);
      
      /**
       * PASO 1: OBTENER RESEÑAS DESDE BASE DE DATOS
       * Usa el DatabaseService para realizar la consulta con JOIN
       */
      const reseñas = await this.databaseService.obtenerReseñasPorUsuario(userId);
      
      console.log(`✅ Obtenidas ${reseñas.length} reseñas del usuario`);
      return reseñas;
      
    } catch (error) {
      console.error('❌ Error obteniendo reseñas del usuario:', error);
      return [];
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE ACTUALIZACIÓN DE RESEÑAS
   * =================================================================================
   * 
   * FUNCIÓN: updateReview()
   * 
   * DESCRIPCIÓN:
   * Actualiza una reseña existente con nuevos datos.
   * 
   * PARÁMETROS:
   * @param reviewId - ID de la reseña a actualizar
   * @param review - Objeto con los nuevos datos (calificacion, comentario)
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si la actualización fue exitosa, false si falló
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Validar que reviewId sea válido
   * 2. Llamar al DatabaseService para actualizar la reseña
   * 3. Manejar errores y retornar resultado
   * 
   * CAMPOS ACTUALIZABLES:
   * - calificacion: Nueva calificación del 1 al 5
   * - comentario: Nuevo comentario de la reseña
   * 
   * EJEMPLO DE USO:
   * const success = await reviewService.updateReview(1, {
   *   calificacion: 4,
   *   comentario: 'Muy bueno, pero podría ser mejor'
   * });
   * 
   * =================================================================================
   */
  async updateReview(reviewId: number, review: Partial<Review>): Promise<boolean> {
    try {
      console.log('🔄 Actualizando reseña:', reviewId);
      
      /**
       * PASO 1: ACTUALIZAR RESEÑA EN BASE DE DATOS
       * Usa el DatabaseService para realizar la actualización
       */
      await this.databaseService.actualizarReseña(reviewId, review);
      
      console.log('✅ Reseña actualizada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error actualizando reseña:', error);
      return false;
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE ELIMINACIÓN DE RESEÑAS
   * =================================================================================
   * 
   * FUNCIÓN: deleteReview()
   * 
   * DESCRIPCIÓN:
   * Elimina una reseña específica de la base de datos.
   * 
   * PARÁMETROS:
   * @param reviewId - ID de la reseña a eliminar
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si la eliminación fue exitosa, false si falló
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Validar que reviewId sea válido
   * 2. Llamar al DatabaseService para eliminar la reseña
   * 3. Manejar errores y retornar resultado
   * 
   * CONSIDERACIONES:
   * - La eliminación es permanente
   * - No se puede deshacer
   * - Se elimina completamente de la base de datos
   * 
   * EJEMPLO DE USO:
   * const success = await reviewService.deleteReview(1);
   * if (success) { console.log('Reseña eliminada'); }
   * 
   * =================================================================================
   */
  async deleteReview(reviewId: number): Promise<boolean> {
    try {
      console.log('🔄 Eliminando reseña:', reviewId);
      
      /**
       * PASO 1: ELIMINAR RESEÑA DE BASE DE DATOS
       * Usa el DatabaseService para realizar la eliminación
       */
      await this.databaseService.eliminarReseña(reviewId);
      
      console.log('✅ Reseña eliminada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error eliminando reseña:', error);
      return false;
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE CÁLCULO DE CALIFICACIÓN PROMEDIO
   * =================================================================================
   * 
   * FUNCIÓN: getAverageRating()
   * 
   * DESCRIPCIÓN:
   * Calcula la calificación promedio de un anime basada en todas sus reseñas.
   * 
   * PARÁMETROS:
   * @param animeId - ID del anime del cual calcular promedio
   * 
   * RETORNA:
   * @returns Promise<number> - Calificación promedio (0 si no hay reseñas)
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Llamar al DatabaseService para calcular promedio
   * 2. Manejar errores y retornar 0 si falla
   * 3. Retornar promedio calculado
   * 
   * CÁLCULO:
   * - Suma todas las calificaciones del anime
   * - Divide por el número total de reseñas
   * - Retorna resultado con decimales
   * 
   * USO TÍPICO:
   * - Mostrar calificación promedio en detalles del anime
   * - Ordenar animes por calificación
   * - Generar estadísticas
   * 
   * EJEMPLO DE USO:
   * const promedio = await reviewService.getAverageRating(123);
   * console.log(`Calificación promedio: ${promedio.toFixed(1)}`);
   * 
   * =================================================================================
   */
  async getAverageRating(animeId: number): Promise<number> {
    try {
      console.log('🔍 Calculando calificación promedio para anime:', animeId);
      
      /**
       * PASO 1: CALCULAR PROMEDIO DESDE BASE DE DATOS
       * Usa el DatabaseService para realizar el cálculo con AVG()
       */
      const promedio = await this.databaseService.obtenerCalificacionPromedio(animeId);
      
      console.log('✅ Calificación promedio calculada:', promedio);
      return promedio;
      
    } catch (error) {
      console.error('❌ Error obteniendo calificación promedio:', error);
      return 0;
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE VERIFICACIÓN DE RESEÑA EXISTENTE
   * =================================================================================
   * 
   * FUNCIÓN: hasUserReviewedAnime()
   * 
   * DESCRIPCIÓN:
   * Verifica si un usuario ya ha reseñado un anime específico.
   * 
   * PARÁMETROS:
   * @param userId - ID del usuario
   * @param animeId - ID del anime
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si ya reseñó, false si no
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Llamar al DatabaseService para verificar existencia
   * 2. Manejar errores y retornar false si falla
   * 3. Retornar resultado de la verificación
   * 
   * USO TÍPICO:
   * - Evitar reseñas duplicadas
   * - Mostrar opción de editar en lugar de crear nueva
   * - Validar antes de permitir nueva reseña
   * 
   * EJEMPLO DE USO:
   * const yaReseño = await reviewService.hasUserReviewedAnime(1, 123);
   * if (yaReseño) {
   *   console.log('Ya reseñó este anime, mostrar opción de editar');
   * } else {
   *   console.log('Puede crear nueva reseña');
   * }
   * 
   * =================================================================================
   */
  async hasUserReviewedAnime(userId: number, animeId: number): Promise<boolean> {
    try {
      console.log('🔍 Verificando si usuario ya reseñó anime:', userId, animeId);
      
      /**
       * PASO 1: VERIFICAR EXISTENCIA EN BASE DE DATOS
       * Usa el DatabaseService para realizar la verificación con COUNT()
       */
      const yaReseño = await this.databaseService.usuarioYaReseño(userId, animeId);
      
      console.log(yaReseño ? '✅ Usuario ya reseñó este anime' : '❌ Usuario no ha reseñado este anime');
      return yaReseño;
      
    } catch (error) {
      console.error('❌ Error verificando reseña:', error);
      return false;
    }
  }
}
