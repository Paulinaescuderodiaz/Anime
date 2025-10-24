import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  IonBackButton, IonButton, IonCard, IonContent, IonHeader, 
  IonIcon, IonTitle, IonToolbar, IonButtons
} from '@ionic/angular/standalone';

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
    private alertCtrl: AlertController
  ) {}

  ngOnInit() {
    this.loadReviews();
  }

  loadReviews() {
    try {
      // Obtener el usuario actual del localStorage
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        this.reviews = [];
        return;
      }
      
      const reviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
      this.reviews = reviews.sort((a: any, b: any) => 
        new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );
    } catch (error) {
      console.error('Error cargando reseñas:', error);
      this.reviews = [];
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
      const currentUser = localStorage.getItem('currentUser');
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
      
      // Eliminar de la lista local
      this.reviews.splice(index, 1);
      
      // Actualizar localStorage del usuario específico
      localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(this.reviews));
      
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
}
