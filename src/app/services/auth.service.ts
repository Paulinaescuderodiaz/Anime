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
      console.log('Intentando registrar usuario:', email);
      
      // Fallback a localStorage si SQLite falla
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      if (existingUser) {
        console.log('Usuario ya existe');
        return false;
      }

      // Registrar en localStorage como fallback
      users.push({ email, password, nombre: nombre || email });
      localStorage.setItem('users', JSON.stringify(users));
      console.log('Usuario registrado exitosamente en localStorage');
      return true;
    } catch (error) {
      console.error('Error registrando usuario:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('Intentando login con:', email);
      
      // Fallback a localStorage si SQLite falla
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      console.log('Resultado del login:', user);
      
      if (user) {
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        console.log('Login exitoso');
        return true;
      }
      console.log('Login fallido - credenciales incorrectas');
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
