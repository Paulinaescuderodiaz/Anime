import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';
import { ApiService, Anime } from '../services/api.service';
import { ReviewService, Review } from '../services/review.service';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip,
  IonTextarea, IonItem, IonLabel, IonBackButton, IonButtons,
  IonSpinner, IonAvatar, IonNote, IonBadge
} from '@ionic/angular/standalone';

/**
 * INTERFAZ PARA MANEJAR ERRORES HTTP
 * 
 * Define la estructura de errores HTTP para un mejor manejo de excepciones.
 */
interface HttpError {
  status?: number;
  message?: string;
  error?: any;
}

/**
 * PÁGINA DE DETALLES DEL ANIME
 * 
 * Esta página muestra información detallada de un anime específico:
 * - Información completa del anime desde la API
 * - Sistema de reseñas y calificaciones
 * - Formulario para crear/editar reseñas
 * - Lista de reseñas de otros usuarios
 * - Navegación de vuelta
 */
@Component({
  selector: 'app-anime-detail',
  templateUrl: './anime-detail.page.html',
  styleUrls: ['./anime-detail.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonChip,
    IonTextarea, IonItem, IonLabel, IonBackButton, IonButtons,
    IonSpinner, IonAvatar, IonNote, IonBadge
  ]
})
export class AnimeDetailPage implements OnInit {
  // === PROPIEDADES PRINCIPALES ===
  
  // Información del anime actual
  anime: Anime | null = null;
  animeId: number = 0;
  
  // Sistema de reseñas
  reviews: Review[] = [];
  averageRating: number = 0;
  
  // Estados de la interfaz
  loading = false;
  reviewForm: FormGroup;
  currentUser: string | null = null;
  userId: number = 1; // Temporal, en producción se obtendría del AuthService
  hasUserReviewed = false;
  userReview: Review | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private navCtrl: NavController,
    private authService: AuthService,
    private apiService: ApiService,
    private reviewService: ReviewService,
    private fb: FormBuilder,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController
  ) {
    this.reviewForm = this.fb.group({
      calificacion: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  /**
   * INICIALIZACIÓN DE LA PÁGINA
   * 
   * Se ejecuta al cargar la página y:
   * 1. Obtiene el usuario actual
   * 2. Valida el ID del anime desde la URL
   * 3. Carga los detalles del anime
   * 4. Carga las reseñas existentes
   * 5. Verifica si el usuario ya reseñó este anime
   */
  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    
    // Obtener y validar el ID del anime desde la URL
    const idParam = this.route.snapshot.paramMap.get('id');
    console.log('ID recibido desde la URL:', idParam);
    
    if (!idParam) {
      console.error('ID de anime no proporcionado:', idParam);
      const toast = await this.toastCtrl.create({
        message: 'ID de anime no proporcionado. Redirigiendo al inicio.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.navCtrl.navigateRoot('/home');
      return;
    }
    
    // Convertir a número y validar
    const numericId = +idParam;
    if (isNaN(numericId) || numericId <= 0) {
      console.error('ID de anime inválido:', idParam, 'convertido a:', numericId);
      const toast = await this.toastCtrl.create({
        message: `ID de anime inválido: ${idParam}. Redirigiendo al inicio.`,
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      this.navCtrl.navigateRoot('/home');
      return;
    }
    
    this.animeId = +idParam;
    console.log('ID de anime válido:', this.animeId);
    
    // Cargar todos los datos necesarios
    await this.loadAnimeDetails();
    await this.loadReviews();
    await this.checkUserReview();
  }

  /**
   * CARGAR DETALLES DEL ANIME
   * 
   * Esta función obtiene la información completa de un anime desde la API:
   * 1. Valida el ID del anime
   * 2. Llama a la API de Jikan para obtener detalles
   * 3. Si falla, crea datos de ejemplo para demostración
   * 4. Maneja errores de conectividad y API
   */
  async loadAnimeDetails() {
    this.loading = true;
    
    // Validar que el ID sea válido
    if (!this.animeId || isNaN(this.animeId) || this.animeId <= 0) {
      console.error('ID de anime inválido:', this.animeId);
      this.loading = false;
      return;
    }
    
    try {
      console.log('Cargando detalles del anime ID:', this.animeId);
      console.log('URL de la API:', `https://api.jikan.moe/v4/anime/${this.animeId}`);
      
      // Obtener detalles del anime desde la API
      const response = await this.apiService.getAnimeById(this.animeId).toPromise();
      console.log('Respuesta completa de la API:', response);
      console.log('Tipo de respuesta:', typeof response);
      console.log('Datos del anime:', response?.data);
      
      // La API de Jikan devuelve los datos en response.data
      this.anime = response?.data || null;
      console.log('Anime procesado:', this.anime);
      
      if (!this.anime) {
        console.log('No se encontró anime con ID:', this.animeId);
        // Crear datos de ejemplo para probar el sistema de calificaciones
        this.anime = {
          id: this.animeId,
          title: `Anime de Prueba ${this.animeId}`,
          description: 'Este es un anime de prueba para demostrar el sistema de calificaciones y reseñas. Puedes escribir tu propia reseña y calificar este anime.',
          image: 'https://via.placeholder.com/300x400/667eea/ffffff?text=Anime+de+Prueba',
          rating: 0,
          genres: ['Acción', 'Aventura'],
          year: 2024,
          status: 'En emisión'
        };
        console.log('Usando datos de ejemplo:', this.anime.title);
        
        const toast = await this.toastCtrl.create({
          message: 'Anime no encontrado en la base de datos. Usando datos de ejemplo.',
          duration: 3000,
          color: 'warning'
        });
        await toast.present();
      } else {
        console.log('Anime cargado:', this.anime.title);
      }
    } catch (error) {
      console.error('Error cargando detalles del anime:', error);
      
      // Probar conectividad de la API
      const isApiConnected = await this.testApiConnectivity();
      console.log('API conectada:', isApiConnected);
      
      // Determinar el tipo de error
      const httpError = error as HttpError;
      const errorMessage = this.getErrorMessage(httpError, isApiConnected);
      
      // Crear datos de ejemplo como fallback
      this.anime = {
        id: this.animeId,
        title: `Anime de Prueba ${this.animeId}`,
        description: 'Este es un anime de prueba para demostrar el sistema de calificaciones y reseñas. Puedes escribir tu propia reseña y calificar este anime.',
        image: 'https://via.placeholder.com/300x400/667eea/ffffff?text=Anime+de+Prueba',
        rating: 0,
        genres: ['Acción', 'Aventura'],
        year: 2024,
        status: 'En emisión'
      };
      
      const toast = await this.toastCtrl.create({
        message: `${errorMessage}. Usando datos de ejemplo.`,
        duration: 4000,
        color: 'warning'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async loadReviews() {
    try {
      this.reviews = await this.reviewService.getReviewsByAnime(this.animeId);
      this.averageRating = await this.reviewService.getAverageRating(this.animeId);
    } catch (error) {
      console.error('Error cargando reseñas:', error);
    }
  }

  async checkUserReview() {
    try {
      this.hasUserReviewed = await this.reviewService.hasUserReviewedAnime(this.userId, this.animeId);
      if (this.hasUserReviewed) {
        const userReviews = await this.reviewService.getReviewsByUser(this.userId);
        this.userReview = userReviews.find(r => r.animeId === this.animeId) || null;
        if (this.userReview) {
          this.reviewForm.patchValue({
            calificacion: this.userReview.calificacion,
            comentario: this.userReview.comentario
          });
        }
      }
    } catch (error) {
      console.error('Error verificando reseña del usuario:', error);
    }
  }

  setRating(rating: number) {
    this.reviewForm.patchValue({ calificacion: rating });
  }

  async submitReview() {
    if (this.reviewForm.invalid) {
      const toast = await this.toastCtrl.create({
        message: 'Completa todos los campos correctamente',
        duration: 2000,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const reviewData = {
      usuarioId: this.userId,
      animeId: this.animeId,
      calificacion: this.reviewForm.value.calificacion,
      comentario: this.reviewForm.value.comentario
    };

    try {
      if (this.hasUserReviewed && this.userReview) {
        // Actualizar reseña existente
        const success = await this.reviewService.updateReview(this.userReview.id!, reviewData);
        if (success) {
          const toast = await this.toastCtrl.create({
            message: 'Reseña actualizada exitosamente',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
        }
      } else {
        // Crear nueva reseña
        const success = await this.reviewService.createReview(reviewData);
        if (success) {
          const toast = await this.toastCtrl.create({
            message: 'Reseña creada exitosamente',
            duration: 2000,
            color: 'success'
          });
          await toast.present();
        }
      }

      // Recargar reseñas
      await this.loadReviews();
      await this.checkUserReview();
      
    } catch (error) {
      console.error('Error guardando reseña:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error guardando reseña',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async deleteReview() {
    if (!this.userReview) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar Reseña',
      message: '¿Estás seguro de que quieres eliminar tu reseña?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              const success = await this.reviewService.deleteReview(this.userReview!.id!);
              if (success) {
                const toast = await this.toastCtrl.create({
                  message: 'Reseña eliminada exitosamente',
                  duration: 2000,
                  color: 'success'
                });
                await toast.present();
                
                // Recargar datos
                await this.loadReviews();
                await this.checkUserReview();
                this.reviewForm.reset();
              }
            } catch (error) {
              console.error('Error eliminando reseña:', error);
            }
          }
        }
      ]
    });

    await alert.present();
  }

  goBack() {
    this.navCtrl.back();
  }

  getStarsArray(rating: number): number[] {
    return Array.from({ length: 5 }, (_, i) => i < rating ? 1 : 0);
  }

  // Método para probar la conectividad de la API
  async testApiConnectivity() {
    try {
      console.log('Probando conectividad con la API de Jikan...');
      const response = await this.apiService.getTopAnimes().toPromise();
      console.log('Conectividad exitosa:', response ? 'Sí' : 'No');
      return response !== null;
    } catch (error) {
      console.error('Error de conectividad:', error);
      return false;
    }
  }

  // Método para obtener un mensaje de error más específico
  private getErrorMessage(error: HttpError, isApiConnected: boolean): string {
    if (!isApiConnected) {
      return 'Sin conexión a internet o API no disponible';
    }
    
    if (error.status === 404) {
      return 'Anime no encontrado en la base de datos';
    } else if (error.status === 429) {
      return 'Demasiadas solicitudes. Intenta más tarde';
    } else if (error.status && error.status >= 500) {
      return 'Error del servidor. Intenta más tarde';
    } else if (error.status && error.status >= 400) {
      return 'Error en la solicitud. Verifica el ID del anime';
    }
    
    return 'Error desconocido al cargar el anime';
  }
}
