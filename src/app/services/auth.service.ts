import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { GoogleAuthService } from './google-auth.service';
import { User } from 'firebase/auth';

/**
 * SERVICIO DE AUTENTICACIÓN
 * 
 * Este servicio maneja toda la lógica de autenticación de usuarios:
 * - Registro de nuevos usuarios
 * - Inicio de sesión
 * - Gestión de sesiones activas
 * - Logout
 * - Almacenamiento en localStorage como fallback
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Usuario actualmente autenticado
  private currentUser: string | null = null;

  constructor(
    private databaseService: DatabaseService,
    private googleAuthService: GoogleAuthService
  ) {
    // Verificar si hay sesión activa al inicializar el servicio
    const storedSession = localStorage.getItem('currentUser');
    if (storedSession) {
      this.currentUser = storedSession;
      console.log('AuthService inicializado con usuario:', this.currentUser);
    } else {
      console.log('AuthService inicializado sin usuario');
    }
  }

  /**
   * REGISTRAR NUEVO USUARIO
   * 
   * Registra un nuevo usuario en el sistema. Utiliza localStorage como
   * almacenamiento principal ya que SQLite puede fallar en algunos casos.
   * 
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @param nombre - Nombre opcional del usuario
   * @returns Promise<boolean> - true si el registro fue exitoso
   */
  async register(email: string, password: string, nombre?: string): Promise<boolean> {
    try {
      console.log('Intentando registrar usuario:', email);
      
      // Obtener usuarios existentes desde localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const existingUser = users.find((u: any) => u.email === email);
      
      // Verificar si el usuario ya existe
      if (existingUser) {
        console.log('Usuario ya existe');
        return false;
      }

      // Registrar nuevo usuario en localStorage
      users.push({ email, password, nombre: nombre || email });
      localStorage.setItem('users', JSON.stringify(users));
      console.log('Usuario registrado exitosamente en localStorage');
      return true;
    } catch (error) {
      console.error('Error registrando usuario:', error);
      return false;
    }
  }

  /**
   * INICIAR SESIÓN DE USUARIO
   * 
   * Autentica un usuario con email y contraseña. Si las credenciales
   * son correctas, establece la sesión activa.
   * 
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * @returns Promise<boolean> - true si el login fue exitoso
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('Intentando login con:', email);
      
      // Buscar usuario en localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      console.log('Resultado del login:', user);
      
      if (user) {
        // Login exitoso - establecer sesión activa
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        console.log('Login exitoso - Usuario guardado:', email);
        console.log('Current user después del login:', this.getCurrentUser());
        return true;
      }
      console.log('Login fallido - credenciales incorrectas');
      return false;
    } catch (error) {
      console.error('Error en login:', error);
      return false;
    }
  }

  /**
   * CERRAR SESIÓN
   * 
   * Cierra la sesión del usuario actual y limpia el almacenamiento local.
   */
  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  /**
   * OBTENER USUARIO ACTUAL
   * 
   * Devuelve el email del usuario actualmente autenticado.
   * 
   * @returns string | null - Email del usuario o null si no hay sesión
   */
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * INICIAR SESIÓN CON GOOGLE
   * 
   * Autentica al usuario usando Google OAuth.
   * @returns Promise<boolean> - true si el login fue exitoso
   */
  async loginWithGoogle(): Promise<boolean> {
    try {
      const user = await this.googleAuthService.signInWithGoogle();
      
      if (user && user.email) {
        this.currentUser = user.email;
        localStorage.setItem('currentUser', user.email);
        
        // Guardar información adicional del usuario
        const userData = {
          email: user.email,
          name: user.displayName || 'Usuario',
          photoURL: user.photoURL || '',
          provider: 'google'
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('Login con Google exitoso:', user.email);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error en login con Google:', error);
      return false;
    }
  }

  /**
   * OBTENER DATOS DEL USUARIO
   * 
   * @returns any - Datos completos del usuario o null
   */
  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * VERIFICAR SI ES USUARIO DE GOOGLE
   * 
   * @returns boolean - true si el usuario se autenticó con Google
   */
  isGoogleUser(): boolean {
    const userData = this.getUserData();
    return userData && userData.provider === 'google';
  }
}
