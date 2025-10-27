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
 * ===================================================================================
 * PÁGINA DE CREACIÓN DE RESEÑAS - AddReviewPage
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Esta página permite a los usuarios crear nuevas reseñas de animes con un sistema
 * completo de formularios, calificaciones, comentarios y captura de fotos.
 * 
 * FUNCIONALIDADES PRINCIPALES:
 * 1. Formulario de reseña con validación completa
 * 2. Sistema de calificación con estrellas (1-5)
 * 3. Campo de comentario extenso
 * 4. Captura de fotos con cámara del dispositivo
 * 5. Selección de imágenes de galería
 * 6. Guardado en SQLite con fallback a localStorage
 * 7. Creación automática de animes temporales
 * 
 * FLUJO DE TRABAJO:
 * 1. Usuario ingresa título del anime
 * 2. Selecciona calificación con slider de estrellas
 * 3. Escribe comentario de la reseña
 * 4. Opcionalmente captura/selecciona foto
 * 5. Envía formulario para guardar en SQLite
 * 6. Si SQLite falla, usa localStorage como fallback
 * 7. Navega de vuelta a home con confirmación
 * 
 * INTEGRACIÓN CON SERVICIOS:
 * - AuthService: Para obtener usuario actual y verificar autenticación
 * - DatabaseService: Para operaciones SQLite (crear anime temporal, obtener usuario)
 * - ReviewService: Para crear la reseña en la base de datos
 * - CameraService: Para captura y selección de fotos
 * 
 * VALIDACIONES:
 * - Formulario debe ser válido
 * - Título del anime no puede estar vacío
 * - Usuario debe estar autenticado
 * - Calificación debe estar entre 1 y 5
 * 
 * MANEJO DE ERRORES:
 * - Sistema robusto de fallback SQLite → localStorage
 * - Mensajes informativos al usuario
 * - Logs detallados para debugging
 * 
 * ===================================================================================
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
  /**
   * =================================================================================
   * PROPIEDADES DEL FORMULARIO Y ESTADO
   * =================================================================================
   */
  
  // Título del anime a reseñar (campo obligatorio)
  // El usuario debe ingresar el nombre del anime manualmente
  animeTitle: string = '';
  
  // Foto seleccionada para la reseña (opcional)
  // Puede ser capturada con cámara o seleccionada de galería
  selectedPhoto: Photo | null = null;
  
  // Calificación del anime (1-5 estrellas)
  // Valor por defecto: 5 (máxima calificación)
  rating: number = 5;
  
  // Comentario de la reseña (campo obligatorio)
  // El usuario debe escribir su opinión sobre el anime
  comment: string = '';
  
  // Estado de envío del formulario
  // Previene múltiples envíos mientras se procesa
  submitting: boolean = false;

  /**
   * =================================================================================
   * CONSTRUCTOR E INYECCIÓN DE DEPENDENCIAS
   * =================================================================================
   */
  constructor(
    private navCtrl: NavController,           // Controlador de navegación
    private reviewService: ReviewService,     // Servicio para gestión de reseñas
    private authService: AuthService,          // Servicio de autenticación
    private cameraService: CameraService,     // Servicio de cámara
    private databaseService: DatabaseService, // Servicio de base de datos SQLite
    private toastCtrl: ToastController,       // Controlador de mensajes toast
    private actionSheetCtrl: ActionSheetController // Controlador de ActionSheet
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
   * =================================================================================
   * MÉTODO PRINCIPAL DE ENVÍO DE RESEÑA
   * =================================================================================
   * 
   * FUNCIÓN: onSubmit()
   * 
   * DESCRIPCIÓN:
   * Este es el método principal que procesa el envío de una nueva reseña.
   * Maneja todo el flujo desde la validación hasta el guardado en la base de datos.
   * 
   * FLUJO DE EJECUCIÓN DETALLADO:
   * 1. VALIDACIÓN: Verificar que el formulario sea válido y tenga datos requeridos
   * 2. AUTENTICACIÓN: Verificar que el usuario esté logueado
   * 3. OBTENER USUARIO: Buscar datos completos del usuario en SQLite
   * 4. CREAR ANIME: Insertar anime temporal en la base de datos
   * 5. CREAR RESEÑA: Guardar la reseña usando ReviewService
   * 6. FALLBACK: Si SQLite falla, usar localStorage como respaldo
   * 7. NAVEGACIÓN: Retornar a home con mensaje de confirmación
   * 
   * PARÁMETROS:
   * @param form - Objeto del formulario Angular con estado de validación
   * 
   * VALIDACIONES REALIZADAS:
   * - Formulario debe ser válido (form.valid)
   * - Título del anime no puede estar vacío (animeTitle.trim())
   * - Usuario debe estar autenticado (authService.getCurrentUser())
   * - Usuario debe existir en la base de datos
   * 
   * MANEJO DE ERRORES:
   * - Error de validación: Muestra toast de advertencia
   * - Error de autenticación: Redirige a login
   * - Error de SQLite: Intenta fallback a localStorage
   * - Error crítico: Muestra mensaje de error
   * 
   * EJEMPLO DE USO:
   * En el template HTML:
   * <form #reviewForm="ngForm" (ngSubmit)="onSubmit(reviewForm)">
   * 
   * =================================================================================
   */
  async onSubmit(form: any) {
    /**
     * PASO 1: VALIDACIÓN DEL FORMULARIO
     * Verificar que el formulario sea válido y tenga datos requeridos
     */
    if (!form.valid || !this.animeTitle.trim()) {
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    // Activar estado de envío para prevenir múltiples envíos
    this.submitting = true;

    try {
      /**
       * PASO 2: VERIFICAR AUTENTICACIÓN DEL USUARIO
       * Obtener el usuario actualmente autenticado
       */
      const currentUser = this.authService.getCurrentUser();
      if (!currentUser) {
        this.showToast('Usuario no autenticado', 'danger');
        this.navCtrl.navigateRoot('/login');
        return;
      }

      /**
       * PASO 3: OBTENER DATOS COMPLETOS DEL USUARIO DESDE SQLITE
       * Buscar el usuario en la base de datos para obtener su ID
       */
      const userData = await this.databaseService.getUserByEmail(currentUser);
      if (!userData) {
        this.showToast('Usuario no encontrado en la base de datos', 'danger');
        return;
      }

      const userId = userData.id;

      /**
       * PASO 4: CREAR ANIME TEMPORAL EN LA BASE DE DATOS
       * Insertar el anime en la tabla 'animes' para mantener integridad referencial
       */
      const tempAnimeId = Date.now(); // ID temporal basado en timestamp
      
      await this.databaseService.insertarAnimeTemporal(
        tempAnimeId, 
        this.animeTitle, 
        'Anime agregado por usuario', 
        this.selectedPhoto?.webviewPath || ''
      );

      /**
       * PASO 5: CREAR LA RESEÑA USANDO EL SERVICIO DE RESEÑAS
       * Usar ReviewService para crear la reseña con todos los datos
       */
      const reviewData = {
        usuarioId: userId,
        animeId: tempAnimeId,
        calificacion: this.rating,
        comentario: this.comment
      };

      const success = await this.reviewService.createReview(reviewData);
      
      if (success) {
        this.showToast('Reseña agregada exitosamente en SQLite', 'success');
        this.navCtrl.navigateBack('/home');
      } else {
        this.showToast('Error al guardar la reseña en SQLite', 'danger');
      }

    } catch (error) {
      console.error('❌ Error guardando reseña en SQLite:', error);
      
      /**
       * PASO 6: FALLBACK A LOCALSTORAGE
       * Si SQLite falla completamente, usar localStorage como respaldo
       */
      try {
        console.log('🔄 Intentando guardar en localStorage como fallback');
        const currentUser = this.authService.getCurrentUser();
        const userId = parseInt(currentUser || '1') || 1;
        const tempAnimeId = Date.now();

        const reviewData = {
          usuarioId: userId,
          animeId: tempAnimeId,
          calificacion: this.rating,
          comentario: this.comment,
          animeTitle: this.animeTitle,
          photo: this.selectedPhoto,
          userEmail: currentUser
        };

        // Guardar en localStorage usando el patrón existente
        const userReviews = JSON.parse(localStorage.getItem(`reviews_${currentUser}`) || '[]');
        userReviews.push({
          ...reviewData,
          id: Date.now(),
          fecha: new Date().toISOString()
        });
        localStorage.setItem(`reviews_${currentUser}`, JSON.stringify(userReviews));

        this.showToast('Reseña guardada en localStorage (fallback)', 'success');
        this.navCtrl.navigateBack('/home');
        
      } catch (fallbackError) {
        console.error('❌ Error en fallback localStorage:', fallbackError);
        this.showToast('Error al guardar la reseña', 'danger');
      }
    } finally {
      // Desactivar estado de envío
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
