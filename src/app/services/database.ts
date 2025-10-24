import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx'

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: SQLiteObject | null = null;

  constructor(private sqlite: SQLite, private platform: Platform) {}

  async crearBD() {
    try {
      await this.platform.ready();
      console.log('Platform ready, creating database...');

      this.db = await this.sqlite.create({
        name: 'AniVerse.db',
        location: 'default'
      });
      console.log('Database created successfully');

      // Crear tablas
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT,
          email TEXT UNIQUE,
          password TEXT
        );
      `, []);

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS animes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT,
          descripcion TEXT,
          imagen TEXT
        );
      `, []);

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS reseñas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuarioId INTEGER,
          animeId INTEGER,
          calificacion INTEGER,
          comentario TEXT,
          FOREIGN KEY(usuarioId) REFERENCES usuarios(id),
          FOREIGN KEY(animeId) REFERENCES animes(id)
        );
      `, []);

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS listas (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          usuarioId INTEGER,
          animeId INTEGER,
          estado TEXT,
          FOREIGN KEY(usuarioId) REFERENCES usuarios(id),
          FOREIGN KEY(animeId) REFERENCES animes(id)
        );
      `, []);

      console.log('Base de datos y tablas listas ');
    } catch (e) {
      console.error('Error creando la BD', e);
      throw e; // Re-throw para que el error se propague
    }
  }

  // ======================
  // Métodos de ejemplo
  // ======================

  async registrarUsuario(nombre: string, email: string, password: string) {
    if (!this.db) return;
    await this.db.executeSql(
      `INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)`,
      [nombre, email, password]
    );
  }

  async login(email: string, password: string) {
    if (!this.db) return null;
    const res = await this.db.executeSql(
      `SELECT * FROM usuarios WHERE email = ? AND password = ?`,
      [email, password]
    );
    return res.rows.length > 0 ? res.rows.item(0) : null;
  }

  async getUserByEmail(email: string) {
    if (!this.db) return null;
    const res = await this.db.executeSql(
      `SELECT * FROM usuarios WHERE email = ?`,
      [email]
    );
    return res.rows.length > 0 ? res.rows.item(0) : null;
  }

  async agregarReseña(usuarioId: number, animeId: number, calificacion: number, comentario: string) {
    if (!this.db) return;
    await this.db.executeSql(
      `INSERT INTO reseñas (usuarioId, animeId, calificacion, comentario) VALUES (?, ?, ?, ?)`,
      [usuarioId, animeId, calificacion, comentario]
    );
  }

  async obtenerReseñas(animeId: number) {
    if (!this.db) return [];
    const res = await this.db.executeSql(
      `SELECT r.*, u.nombre FROM reseñas r JOIN usuarios u ON r.usuarioId = u.id WHERE animeId = ?`,
      [animeId]
    );
    const reseñas = [];
    for (let i = 0; i < res.rows.length; i++) {
      reseñas.push(res.rows.item(i));
    }
    return reseñas;
  }
}
