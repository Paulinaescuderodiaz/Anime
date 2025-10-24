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
  animeTitle: string = '';
  selectedPhoto: Photo | null = null;
  rating: number = 5;
  comment: string = '';
  submitting: boolean = false;

  constructor(
    private navCtrl: NavController,
    private reviewService: ReviewService,
    private authService: AuthService,
    private cameraService: CameraService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    // No necesitamos cargar animes ya que el usuario ingresará el título manualmente
  }

  getStarsArray(rating: number): number[] {
    const stars = [];
    for (let i = 0; i < Math.floor(rating); i++) {
      stars.push(1);
    }
    return stars;
  }

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

  async takePhoto() {
    try {
      const photo = await this.cameraService.takePicture();
      this.selectedPhoto = photo;
    } catch (error) {
      console.error('Error tomando foto:', error);
      this.showToast('Error al tomar la foto', 'danger');
    }
  }

  async selectFromGallery() {
    try {
      const photo = await this.cameraService.selectFromGallery();
      this.selectedPhoto = photo;
    } catch (error) {
      console.error('Error seleccionando foto:', error);
      this.showToast('Error al seleccionar la foto', 'danger');
    }
  }

  removePhoto() {
    this.selectedPhoto = null;
  }

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
