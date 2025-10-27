import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { DatabaseService } from '../services/database';
import { ReviewService } from '../services/review.service';
import {
  IonBackButton, IonButton, IonCard, IonContent, IonHeader, 
  IonIcon, IonTitle, IonToolbar, IonButtons
} from '@ionic/angular/standalone';

/**
 * ===================================================================================
 * PÁGINA DE GESTIÓN DE RESEÑAS DEL USUARIO - MyReviewsPage
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Esta página permite al usuario gestionar todas sus reseñas creadas:
 * - Ver todas sus reseñas en una lista organizada
 * - Editar reseñas existentes
 * - Eliminar reseñas con confirmación
 * - Navegar a crear nuevas reseñas
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 1. Carga de reseñas desde SQLite con fallback a localStorage
 * 2. Visualización de reseñas con calificaciones y fechas
 * 3. Eliminación de reseñas con confirmación
 * 4. Navegación a página de creación de reseñas
 * 5. Formateo de fechas y calificaciones
 * 
 * FLUJO DE TRABAJO:
 * 1. Al cargar: Obtener usuario actual y cargar sus reseñas
 * 2. Mostrar lista de reseñas con información completa
 * 3. Permitir eliminar reseñas con confirmación
 * 4. Navegar a crear nuevas reseñas
 * 
 * INTEGRACIÓN CON SERVICIOS:
 * - AuthService: Para obtener usuario actual
 * - DatabaseService: Para operaciones SQLite
 * - ReviewService: Para gestión de reseñas
 * 
 * MANEJO DE DATOS:
 * - Prioriza SQLite como fuente principal
 * - Fallback automático a localStorage
 * - Ordenamiento por fecha (más recientes primero)
 * 
 * ===================================================================================
 */

@Component({
  selector: 'app-my-reviews',
  templateUrl: 'my-reviews.page.html',
  styleUrls: ['my-reviews.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBackButton, IonButton, IonCard, IonContent, IonHeader, 
    IonIcon, IonTitle, IonToolbar, IonButtons
  ],
})
export class MyReviewsPage implements OnInit {
  reviews: any[] = [];

  constructor(
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private authService: AuthService,
    private databaseService: DatabaseService,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  /**
   * CARGAR RESEÑAS DESDE SQLITE
   * 
   * Carga las reseñas del usuario actual desde SQLite.
   * Si SQLite falla, usa localStorage como fallback.
   */
  async loadReviews() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.reviews = [];
        return;
      }
      
      // Intentar cargar desde SQLite
      const userData = await this.databaseService.getUserByEmail(currentUser);
      if (userData) {
        const reviews = await this.reviewService.getReviewsByUser(userData.id);
        this.reviews = reviews.sort((a: any, b: any) => 
          new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime()
        );
        console.log('Reseñas cargadas desde SQLite:', this.reviews.length);
        return;
      }
      
      // Fallback a localStorage si SQLite falla
      console.log('Fallback a localStorage para cargar reseñas');
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      this.reviews = reviews.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    } catch (error) {
      console.error('Error cargando reseñas:', error);
      
      // Fallback a localStorage en caso de error
      try {
        const currentUser = this.authService.getCurrentUser();
        const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
        this.reviews = reviews.sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
        );
      } catch (fallbackError) {
        console.error('Error en fallback localStorage:', fallbackError);
        this.reviews = [];
      }
    }
  }

  getStarsArray(rating: number): number[] {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(1);
    }
    return stars;
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

  goToAddReview() {
    this.navCtrl.navigateForward('/add-review');
  }

  editReview(review: any) {
    // Por ahora, navegamos a la página de agregar reseña con los datos precargados
    // En el futuro se puede crear una página de edición específica
    this.navCtrl.navigateForward('/add-review');
  }

  async deleteReview(review: any, index: number) {
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
            this.performDelete(review, index);
          }
        }
      ]
    });

    await alert.present();
  }

  async performDelete(review: any, index: number) {
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
          // Eliminar de la lista local
          this.reviews.splice(index, 1);
          
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
      this.reviews.splice(index, 1);
      localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(this.reviews));
      
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
}
