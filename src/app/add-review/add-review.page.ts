import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, ActionSheetController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../services/review.service';
import { AuthService } from '../services/auth.service';
import { CameraService, Photo } from '../services/camera.service';
import {
  IonBackButton, IonButton, IonCard, IonCardContent, IonCardHeader, 
  IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, 
  IonItem, IonLabel, IonRange, IonTextarea, IonTitle, IonToolbar, 
  IonButtons, IonInput
} from '@ionic/angular/standalone';

/**
 * PÁGINA PARA AGREGAR RESEÑAS
 * 
 * Esta página permite a los usuarios crear nuevas reseñas de animes:
 * - Formulario para ingresar título del anime
 * - Sistema de calificación con estrellas
 * - Campo de comentario
 * - Funcionalidad de cámara para agregar fotos
 * - Validación de formulario
 * - Guardado en localStorage por usuario
 */
@Component({
  selector: 'app-add-review',
  templateUrl: 'add-review.page.html',
  styleUrls: ['add-review.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonBackButton, IonButton, IonCard, IonCardContent, IonCardHeader, 
    IonCardSubtitle, IonCardTitle, IonContent, IonHeader, IonIcon, 
    IonItem, IonLabel, IonRange, IonTextarea, IonTitle, IonToolbar, 
    IonButtons, IonInput
  ],
})
export class AddReviewPage implements OnInit {
  // === PROPIEDADES DEL FORMULARIO ===
  
  // Título del anime a reseñar
  animeTitle: string = '';
  
  // Foto seleccionada para la reseña
  selectedPhoto: Photo | null = null;
  
  // Calificación del anime (1-5)
  rating: number = 5;
  
  // Comentario de la reseña
  comment: string = '';
  
  // Estado de envío del formulario
  submitting: boolean = false;

  constructor(
    private navCtrl: NavController,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cameraService: CameraService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  /**
   * INICIALIZACIÓN DE LA PÁGINA
   * 
   * No necesita cargar datos adicionales ya que el usuario
   * ingresará toda la información manualmente.
   */
  async ngOnInit() {
    // No necesitamos cargar animes ya que el usuario ingresará el título manualmente
  }

  /**
   * GENERAR ARRAY DE ESTRELLAS PARA CALIFICACIÓN
   * 
   * Convierte una calificación numérica en un array para mostrar estrellas.
   * 
   * @param rating - Calificación del anime (1-5)
   * @returns Array de números representando estrellas
   */
  getStarsArray(rating: number): number[] {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(1);
    }
    return stars;
  }

  /**
   * MOSTRAR OPCIONES DE CÁMARA
   * 
   * Muestra un ActionSheet con opciones para:
   * - Tomar foto con la cámara
   * - Seleccionar de la galería
   * - Cancelar operación
   */
  async selectPhoto() {
    const actionSheet = await this.actionSheetCtrl.create({
      header: 'Seleccionar foto',
      buttons: [
        {
          text: 'Tomar foto',
          icon: 'camera',
          handler: () => {
            this.takePhoto();
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
   * La foto se asigna a la reseña.
   */
  async takePhoto() {
    try {
      const photo = await this.cameraService.takePicture();
      this.selectedPhoto = photo;
    } catch (error) {
      console.error('Error tomando foto:', error);
      this.showToast('Error al tomar la foto', 'danger');
    }
  }

  /**
   * SELECCIONAR IMAGEN DE LA GALERÍA
   * 
   * Abre la galería del dispositivo para seleccionar una imagen existente.
   * La imagen se asigna a la reseña.
   */
  async selectFromGallery() {
    try {
      const photo = await this.cameraService.selectFromGallery();
      this.selectedPhoto = photo;
    } catch (error) {
      console.error('Error seleccionando foto:', error);
      this.showToast('Error al seleccionar la foto', 'danger');
    }
  }

  /**
   * ELIMINAR FOTO SELECCIONADA
   * 
   * Remueve la foto seleccionada de la reseña.
   */
  removePhoto() {
    this.selectedPhoto = null;
  }

  /**
   * ENVIAR RESEÑA
   * 
   * Esta función procesa el envío de la reseña:
   * 1. Valida el formulario
   * 2. Verifica autenticación del usuario
   * 3. Crea los datos de la reseña
   * 4. Guarda en localStorage por usuario
   * 5. Navega de vuelta a home
   */
  async onSubmit(form: any) {
    if (!form.valid || !this.animeTitle.trim()) {
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    this.submitting = true;

    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showToast('Usuario no autenticado', 'danger');
        this.navCtrl.navigateRoot('/login');
        return;
      }

      // Obtener el ID del usuario (asumiendo que el nombre de usuario es el ID)
      const userId = parseInt(currentUser) || 1; // Fallback a 1 si no se puede parsear

      // Crear un anime temporal con el título ingresado
      const tempAnimeId = Date.now(); // ID temporal basado en timestamp

      const reviewData = {
        usuarioId: userId,
        animeId: tempAnimeId,
        calificacion: this.rating,
        comentario: this.comment,
        animeTitle: this.animeTitle, // Agregar el título del anime
        photo: this.selectedPhoto, // Agregar la foto si existe
        userEmail: currentUser // Agregar el email del usuario
      };

      // Guardar reseñas asociadas al usuario específico
      const userReviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      userReviews.push({
        ...reviewData,
        id: Date.now(),
        fecha: new Date().toISOString()
      });
      localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(userReviews));

      this.showToast('Reseña agregada exitosamente', 'success');
      this.navCtrl.navigateBack('/home');
    } catch (error) {
      console.error('Error guardando reseña:', error);
      this.showToast('Error al guardar la reseña', 'danger');
    } finally {
      this.submitting = false;
    }
  }

  goBack() {
    this.navCtrl.navigateBack('/home');
  }

  private async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      color: color,
      position: 'bottom'
    });
    await toast.present();
  }
}
