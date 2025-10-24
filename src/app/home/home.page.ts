import { Component, OnInit } from '@angular/core';
import { NavController, ToastController, ActionSheetController } from '@ionic/angular';
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
    private actionSheetCtrl: ActionSheetController
  ) {}

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    await this.loadAnimes();
    this.photos = this.cameraService.getPhotos();
  }

  async loadAnimes() {
    this.loading = true;
    try {
      const response = await this.apiService.getTopAnimes().toPromise();
      this.animes = response?.data || [];
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

  onLogout() {
    this.authService.logout();
    this.navCtrl.navigateRoot('/login');
  }
}