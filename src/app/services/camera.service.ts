import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * INTERFAZ PARA FOTOS
 * 
 * Define la estructura de datos para las fotos capturadas:
 * - filepath: Ruta del archivo en el sistema
 * - webviewPath: URL para mostrar en la web
 * - data: Datos en base64 de la imagen
 */
export interface Photo {
  filepath: string;
  webviewPath?: string;
  data?: string;
}

/**
 * SERVICIO DE CÁMARA
 * 
 * Este servicio maneja toda la funcionalidad relacionada con la cámara:
 * - Tomar fotos con la cámara del dispositivo
 * - Seleccionar imágenes de la galería
 * - Guardar fotos en el sistema de archivos
 * - Convertir imágenes a base64
 * - Gestionar la galería de fotos del usuario
 * - Funciona tanto en dispositivos móviles como en navegadores web
 */
@Injectable({
  providedIn: 'root'
})
export class CameraService {
  // Array para almacenar todas las fotos del usuario
  private photos: Photo[] = [];

  constructor() {}

  /**
   * TOMAR FOTO CON LA CÁMARA
   * 
   * Esta función abre la cámara del dispositivo para tomar una nueva foto.
   * En navegadores web, redirige a la selección de archivos.
   * 
   * @returns Promise<Photo> - La foto capturada
   */
  async takePicture(): Promise<Photo> {
    try {
      // Verificar si estamos en un navegador web
      if (this.isWebPlatform()) {
        return await this.selectFromGalleryWeb(); // En web, usar selección de archivo
      }

      // Configurar la cámara para captura
      const image = await Camera.getPhoto({
        quality: 90,                    // Calidad de la imagen (0-100)
        allowEditing: true,             // Permitir edición básica
        resultType: CameraResultType.Uri, // Devolver como URI
        source: CameraSource.Camera     // Usar la cámara del dispositivo
      });

      // Guardar la foto en el sistema de archivos
      const savedImageFile = await this.savePicture(image);
      this.photos.unshift(savedImageFile); // Agregar al inicio del array

      return savedImageFile;
    } catch (error) {
      console.error('Error tomando foto:', error);
      throw error;
    }
  }

  /**
   * SELECCIONAR IMAGEN DE LA GALERÍA
   * 
   * Esta función abre la galería del dispositivo para seleccionar una imagen existente.
   * En navegadores web, redirige a la selección de archivos.
   * 
   * @returns Promise<Photo> - La imagen seleccionada
   */
  async selectFromGallery(): Promise<Photo> {
    try {
      // Verificar si estamos en un navegador web
      if (this.isWebPlatform()) {
        return await this.selectFromGalleryWeb();
      }

      // Configurar la galería para selección
      const image = await Camera.getPhoto({
        quality: 90,                    // Calidad de la imagen (0-100)
        allowEditing: true,             // Permitir edición básica
        resultType: CameraResultType.Uri, // Devolver como URI
        source: CameraSource.Photos    // Usar la galería de fotos
      });

      // Guardar la imagen en el sistema de archivos
      const savedImageFile = await this.savePicture(image);
      this.photos.unshift(savedImageFile); // Agregar al inicio del array

      return savedImageFile;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      throw error;
    }
  }

  /**
   * SELECCIÓN DE ARCHIVOS PARA NAVEGADORES WEB
   * 
   * Esta función crea un input de archivo para navegadores web,
   * ya que no tienen acceso directo a la cámara del dispositivo.
   * 
   * @returns Promise<Photo> - La imagen seleccionada
   */
  private async selectFromGalleryWeb(): Promise<Photo> {
    return new Promise((resolve, reject) => {
      // Crear input de archivo invisible
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*'; // Solo aceptar imágenes
      
      // Manejar selección de archivo
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          try {
            // Convertir archivo a base64
            const base64 = await this.convertFileToBase64(file);
            const photo: Photo = {
              filepath: `web_${Date.now()}.jpg`,
              webviewPath: base64,
              data: base64
            };
            
            this.photos.unshift(photo);
            resolve(photo);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error('No se seleccionó ningún archivo'));
        }
      };
      
      // Manejar cancelación
      input.oncancel = () => {
        reject(new Error('Selección cancelada'));
      };
      
      // Abrir selector de archivos
      input.click();
    });
  }

  /**
   * CONVERTIR ARCHIVO A BASE64
   * 
   * Convierte un archivo de imagen a formato base64 para su almacenamiento
   * y visualización en la aplicación.
   * 
   * @param file - El archivo a convertir
   * @returns Promise<string> - Los datos en base64
   */
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * VERIFICAR SI ESTAMOS EN NAVEGADOR WEB
   * 
   * Detecta si la aplicación se está ejecutando en un navegador web
   * en lugar de en un dispositivo móvil nativo.
   * 
   * @returns boolean - true si es navegador web, false si es nativo
   */
  private isWebPlatform(): boolean {
    return !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform === false;
  }

  /**
   * GUARDAR IMAGEN EN EL SISTEMA DE ARCHIVOS
   * 
   * Esta función guarda una foto capturada en el sistema de archivos del dispositivo.
   * Convierte la imagen a base64 y la almacena en el directorio de datos de la app.
   * 
   * @param cameraPhoto - La foto capturada por la cámara
   * @returns Promise<Photo> - La foto guardada con sus rutas
   */
  private async savePicture(cameraPhoto: any): Promise<Photo> {
    // Convertir la foto a base64
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    const base64Data = await this.convertBlobToBase64(blob) as string;

    // Guardar el archivo en el sistema de archivos
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data // Directorio de datos de la aplicación
    });

    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath,
      data: base64Data
    };
  }

  /**
   * CONVERTIR BLOB A BASE64
   * 
   * Convierte un blob (objeto binario) a formato base64
   * para su almacenamiento y transmisión.
   * 
   * @param blob - El blob a convertir
   * @returns Promise<string> - Los datos en base64
   */
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  /**
   * OBTENER TODAS LAS FOTOS
   * 
   * Devuelve todas las fotos almacenadas en el servicio.
   * 
   * @returns Photo[] - Array con todas las fotos
   */
  getPhotos(): Photo[] {
    return this.photos;
  }

  /**
   * ELIMINAR UNA FOTO
   * 
   * Elimina una foto tanto del sistema de archivos como del array interno.
   * 
   * @param photo - La foto a eliminar
   */
  async deletePhoto(photo: Photo) {
    try {
      // Eliminar del sistema de archivos
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data
      });
      
      // Eliminar del array interno
      this.photos = this.photos.filter(p => p.filepath !== photo.filepath);
    } catch (error) {
      console.error('Error eliminando foto:', error);
    }
  }
}
