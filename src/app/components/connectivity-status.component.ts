import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConnectivityService } from '../services/connectivity.service';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonIcon, IonButton, IonChip } from '@ionic/angular/standalone';

/**
 * COMPONENTE DE ESTADO DE CONECTIVIDAD
 * 
 * Muestra el estado actual de la conectividad con las APIs externas
 * y proporciona información sobre qué fuentes están disponibles.
 */
@Component({
  selector: 'app-connectivity-status',
  templateUrl: './connectivity-status.component.html',
  styleUrls: ['./connectivity-status.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonIcon, IonButton, IonChip
  ]
})
export class ConnectivityStatusComponent implements OnInit {
  
  @Input() showDetails = false;
  
  connectivityResult: any = null;
  isLoading = false;
  lastChecked: Date | null = null;

  constructor(private connectivityService: ConnectivityService) {}

  async ngOnInit() {
    await this.checkConnectivity();
  }

  async checkConnectivity() {
    this.isLoading = true;
    try {
      this.connectivityResult = await this.connectivityService.testAllConnectivity();
      this.lastChecked = new Date();
    } catch (error) {
      console.error('Error verificando conectividad:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getStatusColor(): string {
    if (!this.connectivityResult) return 'medium';
    return this.connectivityResult.isConnected ? 'success' : 'warning';
  }

  getStatusIcon(): string {
    if (!this.connectivityResult) return 'help-circle';
    return this.connectivityResult.isConnected ? 'checkmark-circle' : 'warning';
  }

  getStatusText(): string {
    if (!this.connectivityResult) return 'Verificando...';
    return this.connectivityResult.isConnected ? 'Conectado' : 'Sin conexión';
  }

  getStatusMessage(): string {
    if (!this.connectivityResult) return 'Verificando conectividad...';
    return this.connectivityService.generateStatusMessage(this.connectivityResult);
  }

  formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }
}

