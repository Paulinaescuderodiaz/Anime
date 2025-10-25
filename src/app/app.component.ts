import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database';

/**
 * COMPONENTE PRINCIPAL DE LA APLICACIÓN
 * 
 * Este es el componente raíz de la aplicación de anime. Se encarga de:
 * - Inicializar la aplicación
 * - Configurar la base de datos local
 * - Proporcionar la estructura base con IonApp e IonRouterOutlet
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true, // Corregido
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private databaseService: DatabaseService) {
    // Inicializar la base de datos al arrancar la aplicación
    this.inicializarBD();
  }

  /**
   * INICIALIZACIÓN DE LA BASE DE DATOS
   * 
   * Esta función se ejecuta al iniciar la aplicación y crea
   * las tablas necesarias en la base de datos local SQLite
   */
  async inicializarBD() {
    await this.databaseService.crearBD();
  }
}