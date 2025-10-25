import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiTestService } from '../services/api-test.service';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonSpinner, IonIcon } from '@ionic/angular/standalone';

/**
 * COMPONENTE DE DIAGNÓSTICO DE API
 * 
 * Este componente permite al usuario probar la conectividad
 * con diferentes APIs de animes y ver un reporte detallado.
 */
@Component({
  selector: 'app-api-diagnostic',
  templateUrl: './api-diagnostic.component.html',
  styleUrls: ['./api-diagnostic.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, 
    IonButton, IonSpinner, IonIcon
  ]
})
export class ApiDiagnosticComponent implements OnInit {
  
  // Estado del diagnóstico
  isRunning = false;
  results: any[] = [];
  report = '';
  recommendedApi = '';
  
  // Configuración
  showDetails = false;

  constructor(private apiTestService: ApiTestService) {}

  ngOnInit() {
    // Auto-ejecutar diagnóstico al cargar
    this.runDiagnostic();
  }

  /**
   * EJECUTAR DIAGNÓSTICO COMPLETO
   */
  async runDiagnostic() {
    this.isRunning = true;
    this.results = [];
    this.report = '';
    
    try {
      console.log('Iniciando diagnóstico de APIs...');
      
      const testResults = await this.apiTestService.testAllApis();
      this.results = testResults.results;
      this.recommendedApi = this.apiTestService.getRecommendedApi(testResults.results);
      this.report = this.apiTestService.generateConnectivityReport(testResults.results);
      
      console.log('Diagnóstico completado:', testResults);
      console.log('APIs disponibles:', testResults.available);
      console.log('APIs no disponibles:', testResults.unavailable);
      
    } catch (error) {
      console.error('Error en diagnóstico:', error);
      this.report = 'Error ejecutando diagnóstico: ' + (error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * TOGGLE DETALLES
   */
  toggleDetails() {
    this.showDetails = !this.showDetails;
  }

  /**
   * COPIAR REPORTE
   */
  async copyReport() {
    try {
      await navigator.clipboard.writeText(this.report);
      console.log('Reporte copiado al portapapeles');
    } catch (error) {
      console.error('Error copiando reporte:', error);
    }
  }

  /**
   * OBTENER COLOR DEL ESTADO
   */
  getStatusColor(available: boolean): string {
    return available ? 'success' : 'danger';
  }

  /**
   * OBTENER ICONO DEL ESTADO
   */
  getStatusIcon(available: boolean): string {
    return available ? 'checkmark-circle' : 'close-circle';
  }

  /**
   * OBTENER TEXTO DEL ESTADO
   */
  getStatusText(available: boolean): string {
    return available ? 'Disponible' : 'No disponible';
  }

  /**
   * FORMATO DE TIEMPO
   */
  formatTime(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else {
      return `${(ms / 1000).toFixed(1)}s`;
    }
  }
}
