import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiService, Anime } from '../services/api.service';
import { AnimeApiService, AnimeData } from '../services/anime-api.service';
import { CameraService, Photo } from '../services/camera.service';
import { DatabaseService } from '../services/database';
import { FallbackDataService } from '../services/fallback-data.service';
import { ReviewService } from '../services/review.service';
import {
  IonChip, IonButton, IonIcon, IonCard, IonButtons,
  IonContent, IonHeader, IonMenu, IonMenuButton,
  IonTitle, IonToolbar, IonAvatar, IonLabel, IonSearchbar,
  IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';

/**
 * ===================================================================================
 * PÁGINA PRINCIPAL DE LA APLICACIÓN - HomePage
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Esta es la página principal de la aplicación que integra todas las funcionalidades:
 * - Lista de animes populares desde APIs externas
 * - Sistema de búsqueda de animes
 * - Galería de fotos del usuario (cámara)
 * - Reseñas personalizadas del usuario
 * - Reseñas de otros usuarios
 * - Navegación a otras secciones de la app
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 1. CARGA DE ANIMES: Desde múltiples APIs (AniList, Jikan) con fallback
 * 2. BÚSQUEDA: Sistema de búsqueda en tiempo real
 * 3. CÁMARA: Captura y selección de fotos
 * 4. RESEÑAS: Gestión completa de reseñas del usuario
 * 5. NAVEGACIÓN: Acceso a todas las secciones de la app
 * 6. REFRESH: Pull-to-refresh para actualizar datos
 * 
 * FLUJO DE TRABAJO:
 * 1. Al cargar: Obtener usuario, cargar animes, cargar fotos, cargar reseñas
 * 2. Mostrar animes populares con información completa
 * 3. Permitir búsqueda de animes específicos
 * 4. Mostrar galería de fotos del usuario
 * 5. Mostrar reseñas del usuario y de otros usuarios
 * 6. Permitir navegación a detalles y otras páginas
 * 
 * INTEGRACIÓN CON SERVICIOS:
 * - AuthService: Para gestión de usuarios
 * - AnimeApiService: Para datos de animes desde APIs externas
 * - CameraService: Para funcionalidad de cámara
 * - DatabaseService: Para operaciones SQLite
 * - ReviewService: Para gestión de reseñas
 * - FallbackDataService: Para datos de ejemplo
 * 
 * MANEJO DE DATOS:
 * - Prioriza APIs externas para animes
 * - Usa SQLite para reseñas con fallback a localStorage
 * - Sistema robusto de fallback en caso de errores
 * - Pull-to-refresh para actualizar todos los datos
 * 
 * ===================================================================================
 */
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonChip, IonButton, IonIcon, IonCard, IonButtons,
    IonContent, IonHeader, IonMenu, IonMenuButton,
    IonTitle, IonToolbar, IonAvatar, IonLabel, IonSearchbar,
    IonSpinner, IonRefresher, IonRefresherContent
  ],
})
export class HomePage implements OnInit {
  // === PROPIEDADES PRINCIPALES ===
  
  // Lista de animes obtenidos de la API
  animes: AnimeData[] = [];
  
  // Reseñas personalizadas del usuario actual
  customReviews: any[] = [];
  
  // Reseñas de otros usuarios para mostrar
  otherUsersReviews: any[] = [];
  
  // Estado de carga para mostrar spinners
  loading = false;
  
  // Término de búsqueda para filtrar animes
  searchQuery = '';
  
  // Fotos capturadas con la cámara
  photos: Photo[] = [];
  
  // Usuario actualmente autenticado
  currentUser: string | null = null;

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private apiService: ApiService,
    private animeApiService: AnimeApiService,
    private cameraService: CameraService,
    private databaseService: DatabaseService,
    private fallbackDataService: FallbackDataService,
    private reviewService: ReviewService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  /**
   * INICIALIZACIÓN DE LA PÁGINA
   * 
   * Se ejecuta al cargar la página y:
   * 1. Obtiene el usuario actual
   * 2. Carga los animes desde la API
   * 3. Carga las fotos de la cámara
   * 4. Carga las reseñas del usuario
   * 5. Carga reseñas de otros usuarios
   */
  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    await this.loadAnimes();
    this.photos = this.cameraService.getPhotos();
    this.loadCustomReviews();
    this.loadOtherUsersReviews();
  }

  /**
   * CARGAR ANIMES DESDE LA API
   * 
   * Esta función obtiene los animes populares desde la API de Jikan:
   * 1. Muestra spinner de carga
   * 2. Llama a la API para obtener animes populares
   * 3. Limita a 10 animes para mejor rendimiento
   * 4. Agrega calificaciones aleatorias si no las tienen
   * 5. Maneja errores con mensajes al usuario
   */
  async loadAnimes() {
    this.loading = true;
    try {
      console.log('Cargando animes desde múltiples fuentes...');
      
      // Usar el nuevo servicio que intenta múltiples APIs
      const animes = await this.animeApiService.getTopAnimes().toPromise();
      console.log('Animes obtenidos:', animes);
      
      // Validar que animes no sea undefined y limitar a 10 animes
      this.animes = animes ? animes.slice(0, 10) : [];
      console.log('Animes procesados:', this.animes);
      
      // Log de cada anime para verificar IDs (debug)
      this.animes.forEach((anime, index) => {
        console.log(`Anime ${index + 1}:`, {
          id: anime.id,
          title: anime.title,
          rating: anime.rating,
          source: 'API Externa'
        });
      });
      
      const toast = await this.toastCtrl.create({
        message: `Cargados ${this.animes.length} animes exitosamente`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error cargando animes:', error);
      
      // Usar datos de ejemplo como fallback
      console.log('Usando datos de ejemplo como fallback');
      this.animes = this.fallbackDataService.getSampleAnimes();
      
      const toast = await this.toastCtrl.create({
        message: 'Error cargando animes. Mostrando datos de ejemplo.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  /**
   * BUSCAR ANIMES POR NOMBRE
   * 
   * Esta función busca animes que coincidan con el término de búsqueda.
   * Si no hay término, recarga los animes populares.
   * 
   * @param searchQuery - Término de búsqueda ingresado por el usuario
   */
  async searchAnimes() {
    if (!this.searchQuery.trim()) {
      // Si no hay término de búsqueda, cargar animes populares
      await this.loadAnimes();
      return;
    }

    this.loading = true;
    try {
      console.log('Buscando animes:', this.searchQuery);
      
      // Usar el nuevo servicio de búsqueda
      const animes = await this.animeApiService.searchAnimes(this.searchQuery).toPromise();
      console.log('Resultados de búsqueda:', animes);
      
      // Validar que animes no sea undefined y limitar a 10 animes
      this.animes = animes ? animes.slice(0, 10) : [];
      
      const toast = await this.toastCtrl.create({
        message: `Encontrados ${this.animes.length} animes para "${this.searchQuery}"`,
        duration: 2000,
        color: 'success'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error buscando animes:', error);
      
      // Usar búsqueda en datos de ejemplo como fallback
      console.log('Usando búsqueda en datos de ejemplo como fallback');
      this.animes = this.fallbackDataService.searchSampleAnimes(this.searchQuery);
      
      const toast = await this.toastCtrl.create({
        message: 'Error en la búsqueda. Mostrando resultados de ejemplo.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  /**
   * ACTUALIZAR DATOS (PULL TO REFRESH)
   * 
   * Esta función se ejecuta cuando el usuario hace pull-to-refresh
   * y recarga todos los datos de la página.
   */
  async onRefresh(event: any) {
    await this.loadAnimes();
    this.loadCustomReviews();
    this.loadOtherUsersReviews();
    event.target.complete();
  }

  // === FUNCIONES DE CÁMARA ===
  
  /**
   * MOSTRAR OPCIONES DE CÁMARA
   * 
   * Muestra un ActionSheet con opciones para:
   * - Tomar foto con la cámara
   * - Seleccionar de la galería
   * - Cancelar operación
   */
  async presentActionSheet() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar imagen',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePicture();
          }
        },
        {
          text: 'Seleccionar de galería',
          icon: 'images',
          handler: () => {
            this.selectFromGallery();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    await actionSheet.present();
  }

  /**
   * TOMAR FOTO CON LA CÁMARA
   * 
   * Abre la cámara del dispositivo para capturar una nueva foto.
   * La foto se agrega a la galería del usuario.
   */
  async takePicture() {
    try {
      const photo = await this.cameraService.takePicture();
      this.photos.unshift(photo);
      
      const toast = await this.toastCtrl.create({
        message: 'Foto tomada exitosamente',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error tomando foto:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error tomando foto',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * SELECCIONAR IMAGEN DE LA GALERÍA
   * 
   * Abre la galería del dispositivo para seleccionar una imagen existente.
   * La imagen se agrega a la galería del usuario.
   */
  async selectFromGallery() {
    try {
      const photo = await this.cameraService.selectFromGallery();
      this.photos.unshift(photo);
      
      const toast = await this.toastCtrl.create({
        message: 'Imagen seleccionada exitosamente',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error seleccionando imagen',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * ELIMINAR FOTO
   * 
   * Elimina una foto tanto del servicio de cámara como de la galería local.
   * 
   * @param photo - La foto a eliminar
   */
  async deletePhoto(photo: Photo) {
    await this.cameraService.deletePhoto(photo);
    this.photos = this.cameraService.getPhotos();
  }

  // === FUNCIONES DE NAVEGACIÓN ===
  
  /**
   * NAVEGAR A DETALLES DEL ANIME
   * 
   * Navega a la página de detalles de un anime específico.
   * 
   * @param animeId - ID del anime a mostrar
   */
  goToAnimeDetail(animeId: number) {
    console.log('Navegando a detalles del anime con ID:', animeId);
    console.log('Tipo del ID:', typeof animeId);
    console.log('ID es válido:', !isNaN(animeId) && animeId > 0);
    this.navCtrl.navigateForward(`/anime-detail/${animeId}`);
  }

  /**
   * GENERAR ARRAY DE ESTRELLAS PARA CALIFICACIÓN
   * 
   * Convierte una calificación numérica en un array para mostrar estrellas.
   * 
   * @param rating - Calificación del anime (0-5)
   * @returns Array de números representando estrellas
   */
  getStarsArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    return stars;
  }

  /**
   * CERRAR SESIÓN
   * 
   * Cierra la sesión del usuario y redirige al login.
   */
  onLogout() {
    this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }

  /**
   * NAVEGAR A AGREGAR RESEÑA
   * 
   * Redirige a la página para crear una nueva reseña.
   */
  goToAddReview() {
    this.navCtrl.navigateForward('/add-review');
  }

  /**
   * NAVEGAR A MIS RESEÑAS
   * 
   * Redirige a la página que muestra las reseñas del usuario actual.
   */
  goToMyReviews() {
    this.navCtrl.navigateForward('/my-reviews');
  }

  // === FUNCIONES DE GESTIÓN DE RESEÑAS ===
  
  /**
   * EDITAR RESEÑA
   * 
   * Navega a la página de agregar reseña para editar una existente.
   * (Por ahora usa la misma página, en el futuro se puede crear una específica)
   * 
   * @param review - La reseña a editar
   */
  editReview(review: any) {
    // Por ahora, navegamos a la página de agregar reseña
    // En el futuro se puede crear una página de edición específica
    this.navCtrl.navigateForward('/add-review');
  }

  /**
   * CONFIRMAR ELIMINACIÓN DE RESEÑA
   * 
   * Muestra un diálogo de confirmación antes de eliminar una reseña.
   * 
   * @param review - La reseña a eliminar
   */
  async deleteReview(review: any) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que quieres eliminar la reseña de "${review.animeTitle}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.performDelete(review);
          }
        }
      ]
    });

    await alert.present();
  }

  async performDelete(review: any) {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        const toast = await this.toastCtrl.create({
          message: 'Usuario no autenticado',
          duration: 2000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
        return;
      }
      
      // Intentar eliminar desde SQLite primero
      if (review.id && typeof review.id === 'number') {
        const success = await this.reviewService.deleteReview(review.id);
        if (success) {
          // Recargar las reseñas desde SQLite
          await this.loadCustomReviews();
          
          const toast = await this.toastCtrl.create({
            message: 'Reseña eliminada exitosamente desde SQLite',
            duration: 2000,
            color: 'success',
            position: 'bottom'
          });
          await toast.present();
          return;
        }
      }
      
      // Fallback a localStorage si SQLite falla o no tiene ID
      console.log('Fallback a localStorage para eliminar reseña');
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      const updatedReviews = reviews.filter((r: any) => r.id !== review.id);
      localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(updatedReviews));
      
      // Recargar las reseñas
      await this.loadCustomReviews();
      
      const toast = await this.toastCtrl.create({
        message: 'Reseña eliminada exitosamente desde localStorage',
        duration: 2000,
        color: 'success',
        position: 'bottom'
      });
      await toast.present();
      
    } catch (error) {
      console.error('Error eliminando reseña:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al eliminar la reseña',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    }
  }

  /**
   * CARGAR RESEÑAS PERSONALIZADAS DEL USUARIO
   * 
   * Carga las reseñas creadas por el usuario actual desde SQLite.
   * Si SQLite falla, usa localStorage como fallback.
   */
  async loadCustomReviews() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.customReviews = [];
        return;
      }
      
      // Intentar cargar desde SQLite
      const userData = await this.databaseService.getUserByEmail(currentUser);
      if (userData) {
        const reviews = await this.reviewService.getReviewsByUser(userData.id);
        this.customReviews = reviews.slice(0, 10); // Limitar a 10 reseñas máximo
        console.log('Reseñas cargadas desde SQLite:', this.customReviews.length);
        return;
      }
      
      // Fallback a localStorage si SQLite falla
      console.log('Fallback a localStorage para reseñas');
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      this.customReviews = reviews
        .sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
        .slice(0, 10);
    } catch (error) {
      console.error('Error cargando reseñas personalizadas:', error);
      
      // Fallback a localStorage en caso de error
      try {
        const currentUser = this.authService.getCurrentUser();
        const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
        this.customReviews = reviews.slice(0, 10);
      } catch (fallbackError) {
        console.error('Error en fallback localStorage:', fallbackError);
        this.customReviews = [];
      }
    }
  }

  loadOtherUsersReviews() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.otherUsersReviews = [];
        return;
      }
      
      // Obtener todas las reseñas de todos los usuarios
      const allReviews: any[] = [];
      
      // Buscar todas las claves de reseñas en localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('reviews_') && key !== `reviews_${currentUser}`) {
          const userReviews = JSON.parse(localStorage.getItem(key) || '[]');
          allReviews.push(...userReviews);
        }
      }
      
      // Si no hay reseñas de otros usuarios, crear algunas de ejemplo para demostración
      if (allReviews.length === 0) {
        this.createSampleOtherReviews();
        return;
      }
      
      // Ordenar por fecha y limitar a 15 reseñas máximo
      this.otherUsersReviews = allReviews
        .sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        )
        .slice(0, 15); // Limitar a 15 reseñas máximo
    } catch (error) {
      console.error('Error cargando reseñas de otros usuarios:', error);
      this.otherUsersReviews = [];
    }
  }

  createSampleOtherReviews() {
    // Crear reseñas de ejemplo de otros usuarios
    const sampleReviews = [
      {
        id: Date.now() + 1,
        animeTitle: 'Attack on Titan',
        calificacion: 5,
        comentario: 'Una obra maestra del anime. La historia es increíble y la animación es espectacular.',
        userEmail: 'anime.fan@example.com',
        fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: Date.now() + 2,
        animeTitle: 'Demon Slayer',
        calificacion: 4,
        comentario: 'Muy buena animación y personajes interesantes. La historia es emocionante.',
        userEmail: 'otaku.master@example.com',
        fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: Date.now() + 3,
        animeTitle: 'One Piece',
        calificacion: 5,
        comentario: 'El mejor anime de aventuras. Luffy y su tripulación son increíbles.',
        userEmail: 'pirate.king@example.com',
        fecha: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    this.otherUsersReviews = sampleReviews;
  }

  async refreshOtherReviews() {
    this.loadOtherUsersReviews();
    const toast = await this.toastCtrl.create({
      message: 'Reseñas actualizadas',
      duration: 1500,
      color: 'success',
      position: 'bottom'
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  }
}