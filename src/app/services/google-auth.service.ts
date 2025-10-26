import { Injectable } from '@angular/core';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from '../config/firebase.config';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * SERVICIO DE AUTENTICACIÓN CON GOOGLE
 * 
 * Este servicio maneja la autenticación con Google usando Firebase.
 * Incluye login, logout y gestión del estado del usuario.
 */
@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    // Escuchar cambios en el estado de autenticación
    onAuthStateChanged(auth, (user) => {
      this.userSubject.next(user);
    });
  }

  /**
   * INICIAR SESIÓN CON GOOGLE
   * 
   * Abre un popup para autenticación con Google.
   * @returns Promise<User> - Usuario autenticado
   */
  async signInWithGoogle(): Promise<User> {
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error('Error en autenticación con Google:', error);
      throw error;
    }
  }

  /**
   * CERRAR SESIÓN
   * 
   * Cierra la sesión del usuario actual.
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw error;
    }
  }

  /**
   * OBTENER USUARIO ACTUAL
   * 
   * @returns User | null - Usuario actual o null si no está autenticado
   */
  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  /**
   * VERIFICAR SI EL USUARIO ESTÁ AUTENTICADO
   * 
   * @returns boolean - true si está autenticado, false si no
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * OBTENER INFORMACIÓN DEL USUARIO
   * 
   * @returns Observable<User | null> - Observable del usuario actual
   */
  getUserObservable(): Observable<User | null> {
    return this.user$;
  }
}
