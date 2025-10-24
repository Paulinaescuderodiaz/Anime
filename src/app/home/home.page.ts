import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, ActionSheetController, AlertController } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { ApiService, Anime } from '../services/api.service';
import { CameraService, Photo } from '../services/camera.service';
import { DatabaseService } from '../services/database';
import {
  IonChip, IonButton, IonIcon, IonCard, IonButtons,
  IonContent, IonHeader, IonMenu, IonMenuButton,
  IonTitle, IonToolbar, IonAvatar, IonLabel, IonSearchbar,
  IonSpinner, IonRefresher, IonRefresherContent
} from '@ionic/angular/standalone';

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
  animes: Anime[] = [];
  customReviews: any[] = [];
  loading = false;
  searchQuery = '';
  photos: Photo[] = [];
  currentUser: string | null = null;

  constructor(
    private authService: AuthService,
    private navCtrl: NavController,
    private apiService: ApiService,
    private cameraService: CameraService,
    private databaseService: DatabaseService,
    private toastCtrl: ToastController,
    private actionSheetCtrl: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    await this.loadAnimes();
    this.photos = this.cameraService.getPhotos();
    this.loadCustomReviews();
  }

  async loadAnimes() {
    this.loading = true;
    try {
      const response = await this.apiService.getTopAnimes().toPromise();
      this.animes = response?.data || [];
      
      // Agregar calificaciones de ejemplo si no las tienen
      this.animes = this.animes.map(anime => ({
        ...anime,
        rating: anime.rating || Number((Math.random() * 2 + 3).toFixed(1)) // Calificación entre 3.0 y 5.0
      }));
      
    } catch (error) {
      console.error('Error cargando animes:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error cargando animes',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async searchAnimes() {
    if (!this.searchQuery.trim()) {
      await this.loadAnimes();
      return;
    }

    this.loading = true;
    try {
      const response = await this.apiService.searchAnimes(this.searchQuery).toPromise();
      this.animes = response?.data || [];
    } catch (error) {
      console.error('Error buscando animes:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error en la búsqueda',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading = false;
    }
  }

  async onRefresh(event: any) {
    await this.loadAnimes();
    this.loadCustomReviews();
    event.target.complete();
  }

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

  async deletePhoto(photo: Photo) {
    await this.cameraService.deletePhoto(photo);
    this.photos = this.cameraService.getPhotos();
  }

  goToAnimeDetail(animeId: number) {
    this.navCtrl.navigateForward(`/anime-detail/${animeId}`);
  }

  getStarsArray(rating: number): number[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = Array(fullStars).fill(1);
    if (hasHalfStar) stars.push(0.5);
    return stars;
  }

  onLogout() {
    this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }

  goToAddReview() {
    this.navCtrl.navigateForward('/add-review');
  }

  goToMyReviews() {
    this.navCtrl.navigateForward('/my-reviews');
  }

  editReview(review: any) {
    // Por ahora, navegamos a la página de agregar reseña
    // En el futuro se puede crear una página de edición específica
    this.navCtrl.navigateForward('/add-review');
  }

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
        this.showToast('Usuario no autenticado', 'danger');
        return;
      }
      
      // Obtener reseñas del usuario actual
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      
      // Filtrar la reseña a eliminar
      const updatedReviews = reviews.filter((r: any) => r.id !== review.id);
      
      // Actualizar localStorage del usuario
      localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(updatedReviews));
      
      // Recargar las reseñas en la página
      this.loadCustomReviews();
      
      // Mostrar mensaje de éxito
      const toast = await this.toastCtrl.create({
        message: 'Reseña eliminada exitosamente',
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

  loadCustomReviews() {
    try {
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.customReviews = [];
        return;
      }
      
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      this.customReviews = reviews.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    } catch (error) {
      console.error('Error cargando reseñas personalizadas:', error);
      this.customReviews = [];
    }
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