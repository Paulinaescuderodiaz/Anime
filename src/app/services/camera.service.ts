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
