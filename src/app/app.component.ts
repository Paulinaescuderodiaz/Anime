import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from './services/database';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true, // Corregido
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private databaseService: DatabaseService) {
    this.inicializarBD();
  }

  async inicializarBD() {
    await this.databaseService.crearBD();
  }
}