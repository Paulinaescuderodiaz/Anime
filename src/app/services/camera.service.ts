import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface Photo {
  filepath: string;
  webviewPath?: string;
  data?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  private photos: Photo[] = [];

  constructor() {}

  // Tomar una foto usando la cámara
  async takePicture(): Promise<Photo> {
    try {
      // Verificar si estamos en un navegador web
      if (this.isWebPlatform()) {
        return await this.selectFromGalleryWeb(); // En web, usar selección de archivo
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      const savedImageFile = await this.savePicture(image);
      this.photos.unshift(savedImageFile);

      return savedImageFile;
    } catch (error) {
      console.error('Error tomando foto:', error);
      throw error;
    }
  }

  // Seleccionar imagen de la galería
  async selectFromGallery(): Promise<Photo> {
    try {
      // Verificar si estamos en un navegador web
      if (this.isWebPlatform()) {
        return await this.selectFromGalleryWeb();
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      const savedImageFile = await this.savePicture(image);
      this.photos.unshift(savedImageFile);

      return savedImageFile;
    } catch (error) {
      console.error('Error seleccionando imagen:', error);
      throw error;
    }
  }

  // Método para navegadores web
  private async selectFromGalleryWeb(): Promise<Photo> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (event: any) => {
        const file = event.target.files[0];
        if (file) {
          try {
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
      
      input.oncancel = () => {
        reject(new Error('Selección cancelada'));
      };
      
      input.click();
    });
  }

  // Convertir archivo a base64
  private convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Verificar si estamos en navegador web
  private isWebPlatform(): boolean {
    return !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform === false;
  }

  // Guardar la imagen en el sistema de archivos
  private async savePicture(cameraPhoto: any): Promise<Photo> {
    // Convertir la foto a base64
    const response = await fetch(cameraPhoto.webPath!);
    const blob = await response.blob();
    const base64Data = await this.convertBlobToBase64(blob) as string;

    // Guardar el archivo
    const fileName = new Date().getTime() + '.jpeg';
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data
    });

    return {
      filepath: fileName,
      webviewPath: cameraPhoto.webPath,
      data: base64Data
    };
  }

  // Convertir blob a base64
  private convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  });

  // Obtener todas las fotos
  getPhotos(): Photo[] {
    return this.photos;
  }

  // Eliminar una foto
  async deletePhoto(photo: Photo) {
    try {
      await Filesystem.deleteFile({
        path: photo.filepath,
        directory: Directory.Data
      });
      
      this.photos = this.photos.filter(p => p.filepath !== photo.filepath);
    } catch (error) {
      console.error('Error eliminando foto:', error);
    }
  }
}
