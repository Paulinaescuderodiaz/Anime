import { Injectable } from '@angular/core';
import { DatabaseService } from './database';
import { GoogleAuthService } from './google-auth.service';
import { User } from 'firebase/auth';

/**
 * ===================================================================================
 * SERVICIO DE AUTENTICACIÓN - AuthService
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Este servicio es el núcleo del sistema de autenticación de la aplicación.
 * Maneja todo el ciclo de vida de los usuarios: registro, login, logout y gestión de sesiones.
 * 
 * ARQUITECTURA DE ALMACENAMIENTO:
 * 1. PRIMARIO: SQLite - Base de datos local para dispositivos móviles
 * 2. FALLBACK: localStorage - Almacenamiento web como respaldo
 * 
 * FLUJO DE FUNCIONAMIENTO:
 * - Al inicializar: Verifica si hay una sesión activa
 * - Al registrar: Guarda usuario en SQLite, fallback a localStorage
 * - Al hacer login: Busca en SQLite primero, luego localStorage
 * - Al cerrar sesión: Limpia la sesión activa
 * 
 * INTEGRACIÓN CON OTROS SERVICIOS:
 * - DatabaseService: Para operaciones SQLite
 * - GoogleAuthService: Para autenticación OAuth con Google
 * 
 * MANEJO DE ERRORES:
 * - Sistema robusto de fallback automático
 * - Logs detallados para debugging
 * - Mensajes de error informativos
 * 
 * ===================================================================================
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /**
   * =================================================================================
   * PROPIEDADES PRIVADAS
   * =================================================================================
   */
  
  // Usuario actualmente autenticado (email del usuario)
  // Se mantiene en memoria durante la sesión activa
  private currentUser: string | null = null;

  /**
   * =================================================================================
   * CONSTRUCTOR E INICIALIZACIÓN
   * =================================================================================
   */
  constructor(
    private databaseService: DatabaseService,    // Servicio para operaciones SQLite
    private googleAuthService: GoogleAuthService // Servicio para autenticación Google
  ) {
    /**
     * INICIALIZACIÓN DE SESIÓN:
     * Al crear el servicio, verifica si hay una sesión activa guardada
     * en localStorage. Esto permite mantener la sesión entre reinicios de la app.
     */
    const storedSession = localStorage.getItem('currentUser');
    if (storedSession) {
      this.currentUser = storedSession;
      console.log('✅ AuthService inicializado con usuario activo:', this.currentUser);
    } else {
      console.log('ℹ️ AuthService inicializado sin usuario (sesión nueva)');
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE REGISTRO DE USUARIOS
   * =================================================================================
   * 
   * FUNCIÓN: register()
   * 
   * DESCRIPCIÓN:
   * Registra un nuevo usuario en el sistema con un sistema de almacenamiento híbrido:
   * 1. Intenta guardar en SQLite (método principal)
   * 2. Si SQLite falla, usa localStorage como fallback
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Validar que el email no esté vacío
   * 2. Verificar si el usuario ya existe en SQLite
   * 3. Si no existe, crear el usuario en SQLite
   * 4. Si SQLite falla, intentar con localStorage
   * 5. Retornar resultado (true/false)
   * 
   * PARÁMETROS:
   * @param email - Email único del usuario (usado como identificador)
   * @param password - Contraseña del usuario (sin encriptar por simplicidad)
   * @param nombre - Nombre opcional del usuario (default: email)
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si el registro fue exitoso, false si falló
   * 
   * MANEJO DE ERRORES:
   * - Usuario ya existe: Retorna false
   * - Error SQLite: Intenta localStorage
   * - Error localStorage: Retorna false
   * 
   * EJEMPLO DE USO:
   * const success = await authService.register('user@email.com', 'password123', 'Juan');
   * if (success) { console.log('Usuario registrado'); }
   * 
   * =================================================================================
   */
  async register(email: string, password: string, nombre?: string): Promise<boolean> {
    try {
      console.log('🔄 Iniciando proceso de registro para:', email);
      
      /**
       * PASO 1: VERIFICAR USUARIO EXISTENTE EN SQLITE
       * Busca si ya existe un usuario con ese email en la base de datos SQLite
       */
      const existingUser = await this.databaseService.getUserByEmail(email);
      
      if (existingUser) {
        console.log('❌ Usuario ya existe en SQLite:', email);
        return false;
      }

      /**
       * PASO 2: REGISTRAR USUARIO EN SQLITE
       * Crea el nuevo usuario en la tabla 'usuarios' de SQLite
       */
      await this.databaseService.registrarUsuario(nombre || email, email, password);
      console.log('✅ Usuario registrado exitosamente en SQLite:', email);
      return true;
      
    } catch (error) {
      console.error('❌ Error registrando usuario en SQLite:', error);
      
      /**
       * PASO 3: FALLBACK A LOCALSTORAGE
       * Si SQLite falla, intenta registrar en localStorage como respaldo
       */
      try {
        console.log('🔄 Intentando fallback a localStorage...');
        
        // Obtener usuarios existentes en localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const existingUser = users.find((u: any) => u.email === email);
        
        if (existingUser) {
          console.log('❌ Usuario ya existe en localStorage fallback:', email);
          return false;
        }

        // Agregar nuevo usuario al array
        users.push({ 
          email, 
          password, 
          nombre: nombre || email 
        });
        
        // Guardar en localStorage
        localStorage.setItem('users', JSON.stringify(users));
        console.log('✅ Usuario registrado exitosamente en localStorage (fallback):', email);
        return true;
        
      } catch (fallbackError) {
        console.error('❌ Error crítico en fallback localStorage:', fallbackError);
        return false;
      }
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE INICIO DE SESIÓN
   * =================================================================================
   * 
   * FUNCIÓN: login()
   * 
   * DESCRIPCIÓN:
   * Autentica un usuario con email y contraseña usando un sistema híbrido de almacenamiento:
   * 1. Busca primero en SQLite (método principal)
   * 2. Si no encuentra en SQLite, busca en localStorage (fallback)
   * 3. Si encuentra credenciales válidas, establece la sesión activa
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Buscar usuario en SQLite con email y contraseña
   * 2. Si encuentra en SQLite: establecer sesión y retornar true
   * 3. Si no encuentra en SQLite: buscar en localStorage
   * 4. Si encuentra en localStorage: establecer sesión y retornar true
   * 5. Si no encuentra en ningún lado: retornar false
   * 
   * PARÁMETROS:
   * @param email - Email del usuario a autenticar
   * @param password - Contraseña del usuario
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si el login fue exitoso, false si falló
   * 
   * ESTABLECIMIENTO DE SESIÓN:
   * - Guarda el email del usuario en memoria (currentUser)
   * - Persiste la sesión en localStorage para mantenerla entre reinicios
   * 
   * MANEJO DE ERRORES:
   * - Credenciales incorrectas: Retorna false
   * - Error SQLite: Intenta localStorage
   * - Error localStorage: Retorna false
   * 
   * EJEMPLO DE USO:
   * const success = await authService.login('user@email.com', 'password123');
   * if (success) { console.log('Login exitoso'); }
   * 
   * =================================================================================
   */
  async login(email: string, password: string): Promise<boolean> {
    try {
      console.log('🔄 Iniciando proceso de login para:', email);
      
      /**
       * PASO 1: BUSCAR USUARIO EN SQLITE
       * Ejecuta query SQL para encontrar usuario con email y contraseña coincidentes
       */
      const user = await this.databaseService.login(email, password);
      console.log('🔍 Resultado búsqueda SQLite:', user ? 'Usuario encontrado' : 'Usuario no encontrado');
      
      if (user) {
        /**
         * PASO 2: ESTABLECER SESIÓN ACTIVA
         * Usuario encontrado en SQLite - establecer sesión
         */
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        console.log('✅ Login exitoso con SQLite - Sesión establecida para:', email);
        return true;
      }
      
      /**
       * PASO 3: FALLBACK A LOCALSTORAGE
       * Usuario no encontrado en SQLite - buscar en localStorage
       */
      console.log('🔄 Usuario no encontrado en SQLite, buscando en localStorage...');
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const fallbackUser = users.find((u: any) => u.email === email && u.password === password);
      
      if (fallbackUser) {
        /**
         * PASO 4: ESTABLECER SESIÓN CON FALLBACK
         * Usuario encontrado en localStorage - establecer sesión
         */
        this.currentUser = email;
        localStorage.setItem('currentUser', email);
        console.log('✅ Login exitoso con localStorage fallback - Sesión establecida para:', email);
        return true;
      }
      
      /**
       * PASO 5: LOGIN FALLIDO
         * Usuario no encontrado en ningún almacenamiento
         */
      console.log('❌ Login fallido - Credenciales incorrectas para:', email);
      return false;
      
    } catch (error) {
      console.error('❌ Error en login SQLite:', error);
      
      /**
       * PASO 6: FALLBACK DE EMERGENCIA
       * Si SQLite falla completamente, intentar solo localStorage
       */
      try {
        console.log('🔄 Intentando login solo con localStorage (fallback de emergencia)...');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find((u: any) => u.email === email && u.password === password);
        
        if (user) {
          this.currentUser = email;
          localStorage.setItem('currentUser', email);
          console.log('✅ Login exitoso con localStorage (fallback de emergencia)');
          return true;
        }
        
        console.log('❌ Login fallido en fallback de emergencia');
        return false;
        
      } catch (fallbackError) {
        console.error('❌ Error crítico en fallback localStorage:', fallbackError);
        return false;
      }
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE CIERRE DE SESIÓN
   * =================================================================================
   * 
   * FUNCIÓN: logout()
   * 
   * DESCRIPCIÓN:
   * Cierra la sesión del usuario actual y limpia todos los datos de sesión.
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Limpiar usuario actual de memoria
   * 2. Eliminar sesión persistente de localStorage
   * 
   * EFECTOS:
   * - El usuario ya no estará autenticado
   * - Se perderá acceso a rutas protegidas
   * - Se limpiarán datos de sesión
   * 
   * EJEMPLO DE USO:
   * authService.logout(); // Cierra la sesión actual
   * 
   * =================================================================================
   */
  logout() {
    console.log('🔄 Cerrando sesión para usuario:', this.currentUser);
    this.currentUser = null;
    localStorage.removeItem('currentUser');
    console.log('✅ Sesión cerrada exitosamente');
  }

  /**
   * =================================================================================
   * MÉTODO DE OBTENCIÓN DE USUARIO ACTUAL
   * =================================================================================
   * 
   * FUNCIÓN: getCurrentUser()
   * 
   * DESCRIPCIÓN:
   * Retorna el email del usuario actualmente autenticado.
   * 
   * RETORNA:
   * @returns string | null - Email del usuario o null si no hay sesión
   * 
   * USO TÍPICO:
   * - Verificar si hay usuario autenticado
   * - Obtener identificador del usuario para operaciones
   * - Mostrar información del usuario en la UI
   * 
   * EJEMPLO DE USO:
   * const user = authService.getCurrentUser();
   * if (user) { console.log('Usuario logueado:', user); }
   * 
   * =================================================================================
   */
  getCurrentUser(): string | null {
    return this.currentUser;
  }

  /**
   * =================================================================================
   * MÉTODO DE LOGIN CON GOOGLE
   * =================================================================================
   * 
   * FUNCIÓN: loginWithGoogle()
   * 
   * DESCRIPCIÓN:
   * Autentica al usuario usando Google OAuth a través del GoogleAuthService.
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Llamar al servicio de Google Auth
   * 2. Si es exitoso, establecer sesión con datos de Google
   * 3. Guardar información adicional del usuario
   * 4. Retornar resultado
   * 
   * RETORNA:
   * @returns Promise<boolean> - true si el login fue exitoso
   * 
   * DATOS GUARDADOS:
   * - Email del usuario de Google
   * - Nombre del usuario
   * - URL de foto de perfil
   * - Proveedor (google)
   * 
   * EJEMPLO DE USO:
   * const success = await authService.loginWithGoogle();
   * if (success) { console.log('Login con Google exitoso'); }
   * 
   * =================================================================================
   */
  async loginWithGoogle(): Promise<boolean> {
    try {
      console.log('🔄 Iniciando login con Google...');
      
      /**
       * PASO 1: AUTENTICAR CON GOOGLE
       * Usa el GoogleAuthService para manejar el flujo OAuth
       */
      const user = await this.googleAuthService.signInWithGoogle();
      
      if (user && user.email) {
        /**
         * PASO 2: ESTABLECER SESIÓN CON DATOS DE GOOGLE
         * Usuario autenticado exitosamente con Google
         */
        this.currentUser = user.email;
        localStorage.setItem('currentUser', user.email);
        
        /**
         * PASO 3: GUARDAR INFORMACIÓN ADICIONAL
         * Almacena datos adicionales del usuario de Google
         */
        const userData = {
          email: user.email,
          name: user.displayName || 'Usuario',
          photoURL: user.photoURL || '',
          provider: 'google'
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        console.log('✅ Login con Google exitoso:', user.email);
        return true;
      }
      
      console.log('❌ Login con Google fallido - Sin datos de usuario');
      return false;
      
    } catch (error) {
      console.error('❌ Error en login con Google:', error);
      return false;
    }
  }

  /**
   * =================================================================================
   * MÉTODO DE OBTENCIÓN DE DATOS DEL USUARIO
   * =================================================================================
   * 
   * FUNCIÓN: getUserData()
   * 
   * DESCRIPCIÓN:
   * Obtiene los datos completos del usuario almacenados en localStorage.
   * 
   * RETORNA:
   * @returns any - Datos completos del usuario o null si no existen
   * 
   * DATOS INCLUIDOS:
   * - email: Email del usuario
   * - name: Nombre del usuario
   * - photoURL: URL de la foto de perfil
   * - provider: Proveedor de autenticación (google, local)
   * 
   * EJEMPLO DE USO:
   * const userData = authService.getUserData();
   * if (userData) { console.log('Nombre:', userData.name); }
   * 
   * =================================================================================
   */
  getUserData(): any {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * =================================================================================
   * MÉTODO DE VERIFICACIÓN DE USUARIO GOOGLE
   * =================================================================================
   * 
   * FUNCIÓN: isGoogleUser()
   * 
   * DESCRIPCIÓN:
   * Verifica si el usuario actual se autenticó usando Google OAuth.
   * 
   * RETORNA:
   * @returns boolean - true si es usuario de Google, false si no
   * 
   * USO TÍPICO:
   * - Mostrar/ocultar opciones específicas de Google
   * - Personalizar UI según el proveedor de autenticación
   * - Manejar logout específico de Google
   * 
   * EJEMPLO DE USO:
   * if (authService.isGoogleUser()) { 
   *   console.log('Usuario autenticado con Google'); 
   * }
   * 
   * =================================================================================
   */
  isGoogleUser(): boolean {
    const userData = this.getUserData();
    return userData && userData.provider === 'google';
  }
}
