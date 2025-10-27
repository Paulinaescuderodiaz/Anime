import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx'

/**
 * ===================================================================================
 * SERVICIO DE BASE DE DATOS SQLITE - DatabaseService
 * ===================================================================================
 * 
 * DESCRIPCIÓN GENERAL:
 * Este servicio es el núcleo del sistema de persistencia de datos de la aplicación.
 * Maneja todas las operaciones de base de datos SQLite para dispositivos móviles.
 * 
 * ARQUITECTURA DE DATOS:
 * La aplicación utiliza SQLite como base de datos local con las siguientes tablas:
 * 
 * 1. USUARIOS (usuarios):
 *    - id: Identificador único autoincremental
 *    - nombre: Nombre del usuario
 *    - email: Email único del usuario
 *    - password: Contraseña del usuario
 * 
 * 2. ANIMES (animes):
 *    - id: Identificador único autoincremental
 *    - titulo: Título del anime
 *    - descripcion: Descripción/sinopsis del anime
 *    - imagen: URL o ruta de la imagen del anime
 * 
 * 3. RESEÑAS (reseñas):
 *    - id: Identificador único autoincremental
 *    - usuarioId: ID del usuario que hizo la reseña (FK)
 *    - animeId: ID del anime reseñado (FK)
 *    - calificacion: Calificación numérica (1-5)
 *    - comentario: Comentario de la reseña
 * 
 * 4. LISTAS (listas):
 *    - id: Identificador único autoincremental
 *    - usuarioId: ID del usuario propietario (FK)
 *    - animeId: ID del anime en la lista (FK)
 *    - estado: Estado del anime (viendo, completado, pendiente, etc.)
 * 
 * FLUJO DE FUNCIONAMIENTO:
 * 1. Inicialización: Crea la base de datos y tablas al arrancar la app
 * 2. Operaciones CRUD: Insertar, leer, actualizar y eliminar datos
 * 3. Relaciones: Mantiene integridad referencial entre tablas
 * 4. Consultas: Ejecuta queries SQL complejas para obtener datos específicos
 * 
 * INTEGRACIÓN CON OTROS SERVICIOS:
 * - AuthService: Para operaciones de usuarios
 * - ReviewService: Para gestión de reseñas
 * - HomePage: Para mostrar datos en la interfaz
 * 
 * MANEJO DE ERRORES:
 * - Verificación de conexión antes de operaciones
 * - Logs detallados para debugging
 * - Manejo graceful de errores de SQLite
 * 
 * DEPENDENCIAS:
 * - @awesome-cordova-plugins/sqlite: Plugin para SQLite en dispositivos móviles
 * - @ionic/angular Platform: Para detectar cuando la plataforma está lista
 * 
 * ===================================================================================
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  /**
   * =================================================================================
   * PROPIEDADES PRIVADAS
   * =================================================================================
   */
  
  // Objeto de base de datos SQLite
  // Se inicializa cuando la plataforma está lista
  private db: SQLiteObject | null = null;

  /**
   * =================================================================================
   * CONSTRUCTOR E INYECCIÓN DE DEPENDENCIAS
   * =================================================================================
   */
  constructor(
    private sqlite: SQLite,      // Servicio SQLite de Cordova
    private platform: Platform   // Servicio de plataforma de Ionic
  ) {}

  /**
   * =================================================================================
   * MÉTODO DE INICIALIZACIÓN DE BASE DE DATOS
   * =================================================================================
   * 
   * FUNCIÓN: crearBD()
   * 
   * DESCRIPCIÓN:
   * Este es el método principal que inicializa la base de datos SQLite.
   * Se ejecuta al arrancar la aplicación y crea todas las tablas necesarias.
   * 
   * FLUJO DE EJECUCIÓN:
   * 1. Esperar a que la plataforma esté lista
   * 2. Crear la base de datos 'AniVerse.db'
   * 3. Crear tabla 'usuarios' con campos y restricciones
   * 4. Crear tabla 'animes' con campos básicos
   * 5. Crear tabla 'reseñas' con relaciones foráneas
   * 6. Crear tabla 'listas' con relaciones foráneas
   * 7. Confirmar creación exitosa
   * 
   * MANEJO DE ERRORES:
   * - Si falla la creación, lanza el error para que sea manejado por el llamador
   * - Logs detallados para debugging
   * 
   * EJEMPLO DE USO:
   * await databaseService.crearBD(); // Se llama desde app.component.ts
   * 
   * =================================================================================
   */
  async crearBD() {
    try {
      /**
       * PASO 1: ESPERAR PLATAFORMA LISTA
       * Asegura que el dispositivo esté completamente inicializado
       */
      await this.platform.ready();
      console.log('✅ Platform ready, iniciando creación de base de datos...');

      /**
       * PASO 2: CREAR BASE DE DATOS SQLITE
       * Crea la base de datos 'AniVerse.db' en la ubicación por defecto
       */
      this.db = await this.sqlite.create({
        name: 'AniVerse.db',    // Nombre de la base de datos
        location: 'default'     // Ubicación por defecto del dispositivo
      });
      console.log('✅ Base de datos creada exitosamente');

      /**
       * PASO 3: CREAR TABLA DE USUARIOS
       * Tabla principal para almacenar información de usuarios registrados
       */
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID único autoincremental
          nombre TEXT,                          -- Nombre del usuario
          email TEXT UNIQUE,                    -- Email único (restricción de unicidad)
          password TEXT                         -- Contraseña del usuario
        );
      `, []);

      /**
       * PASO 4: CREAR TABLA DE ANIMES
       * Tabla para almacenar información de animes (tanto de API como creados por usuarios)
       */
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS animes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID único autoincremental
          titulo TEXT,                          -- Título del anime
          descripcion TEXT,                     -- Descripción/sinopsis
          imagen TEXT                           -- URL o ruta de imagen
        );
      `, []);

      /**
       * PASO 5: CREAR TABLA DE RESEÑAS
       * Tabla para almacenar reseñas de usuarios sobre animes
       * Incluye relaciones foráneas para mantener integridad referencial
       */
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS reseñas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID único autoincremental
          usuarioId INTEGER,                    -- ID del usuario (FK)
          animeId INTEGER,                      -- ID del anime (FK)
          calificacion INTEGER,                 -- Calificación 1-5
          comentario TEXT,                      -- Comentario de la reseña
          FOREIGN KEY(usuarioId) REFERENCES usuarios(id),  -- Relación con usuarios
          FOREIGN KEY(animeId) REFERENCES animes(id)        -- Relación con animes
        );
      `, []);

      /**
       * PASO 6: CREAR TABLA DE LISTAS
       * Tabla para almacenar listas personalizadas de animes por usuario
       * Permite a los usuarios organizar animes por estado (viendo, completado, etc.)
       */
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS listas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,  -- ID único autoincremental
          usuarioId INTEGER,                    -- ID del usuario propietario (FK)
          animeId INTEGER,                      -- ID del anime en la lista (FK)
          estado TEXT,                          -- Estado del anime (viendo, completado, pendiente)
          FOREIGN KEY(usuarioId) REFERENCES usuarios(id),  -- Relación con usuarios
          FOREIGN KEY(animeId) REFERENCES animes(id)       -- Relación con animes
        );
      `, []);

      console.log('✅ Base de datos y tablas creadas exitosamente');
      
    } catch (e) {
      console.error('❌ Error creando la base de datos:', e);
      throw e; // Re-lanzar el error para que sea manejado por el llamador
    }
  }

  /**
   * =================================================================================
   * MÉTODOS CRUD PARA GESTIÓN DE USUARIOS
   * =================================================================================
   */

  /**
   * FUNCIÓN: registrarUsuario()
   * 
   * DESCRIPCIÓN:
   * Registra un nuevo usuario en la base de datos SQLite.
   * 
   * PARÁMETROS:
   * @param nombre - Nombre del usuario
   * @param email - Email único del usuario
   * @param password - Contraseña del usuario
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar INSERT con parámetros preparados
   * 3. Manejar errores de unicidad de email
   * 
   * EJEMPLO DE USO:
   * await databaseService.registrarUsuario('Juan', 'juan@email.com', 'password123');
   * 
   * =================================================================================
   */
  async registrarUsuario(nombre: string, email: string, password: string) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return;
    }
    
    console.log('🔄 Registrando usuario:', email);
    await this.db.executeSql(
      `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`,
      [nombre, email, password]
    );
    console.log('✅ Usuario registrado exitosamente');
  }

  /**
   * FUNCIÓN: login()
   * 
   * DESCRIPCIÓN:
   * Autentica un usuario buscando sus credenciales en la base de datos.
   * 
   * PARÁMETROS:
   * @param email - Email del usuario
   * @param password - Contraseña del usuario
   * 
   * RETORNA:
   * @returns any - Datos del usuario si las credenciales son correctas, null si no
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar SELECT con WHERE para email y password
   * 3. Retornar el primer resultado o null
   * 
   * EJEMPLO DE USO:
   * const user = await databaseService.login('juan@email.com', 'password123');
   * if (user) { console.log('Login exitoso'); }
   * 
   * =================================================================================
   */
  async login(email: string, password: string) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return null;
    }
    
    console.log('🔍 Buscando usuario:', email);
    const res = await this.db.executeSql(
      `SELECT * FROM usuarios WHERE email = ? AND password = ?`,
      [email, password]
    );
    
    const user = res.rows.length > 0 ? res.rows.item(0) : null;
    console.log(user ? '✅ Usuario encontrado' : '❌ Usuario no encontrado');
    return user;
  }

  /**
   * FUNCIÓN: getUserByEmail()
   * 
   * DESCRIPCIÓN:
   * Busca un usuario específico por su email.
   * 
   * PARÁMETROS:
   * @param email - Email del usuario a buscar
   * 
   * RETORNA:
   * @returns any - Datos del usuario si existe, null si no
   * 
   * USO TÍPICO:
   * - Verificar si un usuario ya existe antes de registrar
   * - Obtener datos completos del usuario para operaciones
   * 
   * EJEMPLO DE USO:
   * const user = await databaseService.getUserByEmail('juan@email.com');
   * if (user) { console.log('Usuario existe:', user.nombre); }
   * 
   * =================================================================================
   */
  async getUserByEmail(email: string) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return null;
    }
    
    console.log('🔍 Buscando usuario por email:', email);
    const res = await this.db.executeSql(
      `SELECT * FROM usuarios WHERE email = ?`,
      [email]
    );
    
    const user = res.rows.length > 0 ? res.rows.item(0) : null;
    console.log(user ? '✅ Usuario encontrado' : '❌ Usuario no encontrado');
    return user;
  }

  /**
   * =================================================================================
   * MÉTODOS CRUD PARA GESTIÓN DE RESEÑAS
   * =================================================================================
   */

  /**
   * FUNCIÓN: agregarReseña()
   * 
   * DESCRIPCIÓN:
   * Agrega una nueva reseña de un usuario sobre un anime.
   * 
   * PARÁMETROS:
   * @param usuarioId - ID del usuario que hace la reseña
   * @param animeId - ID del anime reseñado
   * @param calificacion - Calificación numérica (1-5)
   * @param comentario - Comentario de la reseña
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar INSERT en tabla reseñas
   * 3. Mantener integridad referencial con usuarios y animes
   * 
   * EJEMPLO DE USO:
   * await databaseService.agregarReseña(1, 123, 5, 'Excelente anime!');
   * 
   * =================================================================================
   */
  async agregarReseña(usuarioId: number, animeId: number, calificacion: number, comentario: string) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return;
    }
    
    console.log('🔄 Agregando reseña para anime:', animeId);
    await this.db.executeSql(
      `INSERT INTO reseñas (usuarioId, animeId, calificacion, comentario) VALUES (?, ?, ?, ?)`,
      [usuarioId, animeId, calificacion, comentario]
    );
    console.log('✅ Reseña agregada exitosamente');
  }

  /**
   * FUNCIÓN: obtenerReseñas()
   * 
   * DESCRIPCIÓN:
   * Obtiene todas las reseñas de un anime específico con información del usuario.
   * 
   * PARÁMETROS:
   * @param animeId - ID del anime del cual obtener reseñas
   * 
   * RETORNA:
   * @returns any[] - Array de reseñas con datos del usuario
   * 
   * FLUJO:
   * 1. Ejecutar JOIN entre tablas reseñas y usuarios
   * 2. Filtrar por animeId
   * 3. Ordenar por fecha de creación (más recientes primero)
   * 4. Retornar array de objetos
   * 
   * EJEMPLO DE USO:
   * const reseñas = await databaseService.obtenerReseñas(123);
   * reseñas.forEach(r => console.log(r.comentario));
   * 
   * =================================================================================
   */
  async obtenerReseñas(animeId: number) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return [];
    }
    
    console.log('🔍 Obteniendo reseñas para anime:', animeId);
    const res = await this.db.executeSql(
      `SELECT r.*, u.nombre FROM reseñas r JOIN usuarios u ON r.usuarioId = u.id WHERE animeId = ? ORDER BY r.id DESC`,
      [animeId]
    );
    
    const reseñas = [];
    for (let i = 0; i < res.rows.length; i++) {
      reseñas.push(res.rows.item(i));
    }
    
    console.log(`✅ Obtenidas ${reseñas.length} reseñas`);
    return reseñas;
  }

  /**
   * FUNCIÓN: obtenerReseñasPorUsuario()
   * 
   * DESCRIPCIÓN:
   * Obtiene todas las reseñas realizadas por un usuario específico.
   * 
   * PARÁMETROS:
   * @param usuarioId - ID del usuario del cual obtener reseñas
   * 
   * RETORNA:
   * @returns any[] - Array de reseñas con datos del anime
   * 
   * FLUJO:
   * 1. Ejecutar JOIN entre tablas reseñas y animes
   * 2. Filtrar por usuarioId
   * 3. Ordenar por fecha de creación (más recientes primero)
   * 4. Retornar array de objetos
   * 
   * EJEMPLO DE USO:
   * const misReseñas = await databaseService.obtenerReseñasPorUsuario(1);
   * misReseñas.forEach(r => console.log(r.animeTitulo));
   * 
   * =================================================================================
   */
  async obtenerReseñasPorUsuario(usuarioId: number) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return [];
    }
    
    console.log('🔍 Obteniendo reseñas para usuario:', usuarioId);
    const res = await this.db.executeSql(
      `SELECT r.*, a.titulo as animeTitulo FROM reseñas r JOIN animes a ON r.animeId = a.id WHERE usuarioId = ? ORDER BY r.id DESC`,
      [usuarioId]
    );
    
    const reseñas = [];
    for (let i = 0; i < res.rows.length; i++) {
      reseñas.push(res.rows.item(i));
    }
    
    console.log(`✅ Obtenidas ${reseñas.length} reseñas del usuario`);
    return reseñas;
  }

  /**
   * FUNCIÓN: actualizarReseña()
   * 
   * DESCRIPCIÓN:
   * Actualiza una reseña existente con nuevos datos.
   * 
   * PARÁMETROS:
   * @param reseñaId - ID de la reseña a actualizar
   * @param datos - Objeto con los nuevos datos (calificacion, comentario)
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar UPDATE con los nuevos datos
   * 3. Confirmar actualización exitosa
   * 
   * EJEMPLO DE USO:
   * await databaseService.actualizarReseña(1, { calificacion: 4, comentario: 'Muy bueno' });
   * 
   * =================================================================================
   */
  async actualizarReseña(reseñaId: number, datos: any) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return;
    }
    
    console.log('🔄 Actualizando reseña:', reseñaId);
    await this.db.executeSql(
      `UPDATE reseñas SET calificacion = ?, comentario = ? WHERE id = ?`,
      [datos.calificacion, datos.comentario, reseñaId]
    );
    console.log('✅ Reseña actualizada exitosamente');
  }

  /**
   * FUNCIÓN: eliminarReseña()
   * 
   * DESCRIPCIÓN:
   * Elimina una reseña específica de la base de datos.
   * 
   * PARÁMETROS:
   * @param reseñaId - ID de la reseña a eliminar
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar DELETE con el ID específico
   * 3. Confirmar eliminación exitosa
   * 
   * EJEMPLO DE USO:
   * await databaseService.eliminarReseña(1);
   * 
   * =================================================================================
   */
  async eliminarReseña(reseñaId: number) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return;
    }
    
    console.log('🔄 Eliminando reseña:', reseñaId);
    await this.db.executeSql(
      `DELETE FROM reseñas WHERE id = ?`,
      [reseñaId]
    );
    console.log('✅ Reseña eliminada exitosamente');
  }

  /**
   * =================================================================================
   * MÉTODOS DE CONSULTAS AVANZADAS
   * =================================================================================
   */

  /**
   * FUNCIÓN: obtenerCalificacionPromedio()
   * 
   * DESCRIPCIÓN:
   * Calcula la calificación promedio de un anime basada en todas sus reseñas.
   * 
   * PARÁMETROS:
   * @param animeId - ID del anime del cual calcular promedio
   * 
   * RETORNA:
   * @returns number - Calificación promedio (0 si no hay reseñas)
   * 
   * FLUJO:
   * 1. Ejecutar función AVG() de SQL
   * 2. Filtrar por animeId
   * 3. Retornar promedio o 0 si no hay datos
   * 
   * EJEMPLO DE USO:
   * const promedio = await databaseService.obtenerCalificacionPromedio(123);
   * console.log('Calificación promedio:', promedio);
   * 
   * =================================================================================
   */
  async obtenerCalificacionPromedio(animeId: number) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return 0;
    }
    
    console.log('🔍 Calculando calificación promedio para anime:', animeId);
    const res = await this.db.executeSql(
      `SELECT AVG(calificacion) as promedio FROM reseñas WHERE animeId = ?`,
      [animeId]
    );
    
    const promedio = res.rows.length > 0 ? res.rows.item(0).promedio || 0 : 0;
    console.log('✅ Calificación promedio calculada:', promedio);
    return promedio;
  }

  /**
   * FUNCIÓN: usuarioYaReseño()
   * 
   * DESCRIPCIÓN:
   * Verifica si un usuario ya ha reseñado un anime específico.
   * 
   * PARÁMETROS:
   * @param usuarioId - ID del usuario
   * @param animeId - ID del anime
   * 
   * RETORNA:
   * @returns boolean - true si ya reseñó, false si no
   * 
   * FLUJO:
   * 1. Ejecutar COUNT() para contar reseñas del usuario para el anime
   * 2. Retornar true si count > 0, false si no
   * 
   * USO TÍPICO:
   * - Evitar reseñas duplicadas
   * - Mostrar opción de editar en lugar de crear nueva
   * 
   * EJEMPLO DE USO:
   * const yaReseño = await databaseService.usuarioYaReseño(1, 123);
   * if (yaReseño) { console.log('Ya reseñó este anime'); }
   * 
   * =================================================================================
   */
  async usuarioYaReseño(usuarioId: number, animeId: number) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return false;
    }
    
    console.log('🔍 Verificando si usuario ya reseñó anime:', usuarioId, animeId);
    const res = await this.db.executeSql(
      `SELECT COUNT(*) as count FROM reseñas WHERE usuarioId = ? AND animeId = ?`,
      [usuarioId, animeId]
    );
    
    const yaReseño = res.rows.length > 0 ? res.rows.item(0).count > 0 : false;
    console.log(yaReseño ? '✅ Usuario ya reseñó este anime' : '❌ Usuario no ha reseñado este anime');
    return yaReseño;
  }

  /**
   * FUNCIÓN: insertarAnimeTemporal()
   * 
   * DESCRIPCIÓN:
   * Inserta un anime temporal en la base de datos para reseñas creadas por usuarios.
   * 
   * PARÁMETROS:
   * @param id - ID único del anime (usualmente timestamp)
   * @param titulo - Título del anime
   * @param descripcion - Descripción del anime
   * @param imagen - URL o ruta de la imagen
   * 
   * FLUJO:
   * 1. Verificar que la base de datos esté inicializada
   * 2. Ejecutar INSERT en tabla animes
   * 3. Confirmar inserción exitosa
   * 
   * USO TÍPICO:
   * - Cuando un usuario crea una reseña para un anime que no está en la API
   * - Crear referencias temporales para mantener integridad referencial
   * 
   * EJEMPLO DE USO:
   * await databaseService.insertarAnimeTemporal(123456, 'Mi Anime', 'Descripción', 'imagen.jpg');
   * 
   * =================================================================================
   */
  async insertarAnimeTemporal(id: number, titulo: string, descripcion: string, imagen: string) {
    if (!this.db) {
      console.error('❌ Base de datos no inicializada');
      return;
    }
    
    console.log('🔄 Insertando anime temporal:', titulo);
    await this.db.executeSql(
      `INSERT INTO animes (id, titulo, descripcion, imagen) VALUES (?, ?, ?, ?)`,
      [id, titulo, descripcion, imagen]
    );
    console.log('✅ Anime temporal insertado exitosamente');
  }
}
