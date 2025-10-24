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
  anime: Anime | null = null;
  animeId: number = 0;
  reviews: Review[] = [];
  averageRating: number = 0;
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

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.animeId = +this.route.snapshot.paramMap.get('id')!;
    
    if (this.animeId) {
      await this.loadAnimeDetails();
      await this.loadReviews();
      await this.checkUserReview();
    }
  }

  async loadAnimeDetails() {
    this.loading = true;
    try {
      const response = await this.apiService.getAnimeById(this.animeId).toPromise();
      this.anime = response?.data || null;
    } catch (error) {
      console.error('Error cargando detalles del anime:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error cargando detalles del anime',
        duration: 2000,
        color: 'danger'
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
}
