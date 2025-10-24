import { Injectable } from '@angular/core';
import { DatabaseService } from './database';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: string | null = null;

  constructor(private databaseService: DatabaseService) {
    // Verificar si hay sesión activa
    const storedSession = localStorage.getItem('currentUser');
    if (storedSession) {
      this.currentUser = storedSession;
    }
  }

  async register(email: string, password: string, nombre?: string): Promise<boolean> {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.databaseService.login(email, password);
      if (existingUser) {
        return false; // Usuario ya existe
      }

      // Registrar nuevo usuario
      await this.databaseService.registrarUsuario(nombre || email, email, password);
      return true;
    } catch (error) {
      console.error('Error registrando usuario:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const user = await this.databaseService.login(email, password);
      if (user) {
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  getCurrentUser(): string | null {
    return this.currentUser;
  }
}
