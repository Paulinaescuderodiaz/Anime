import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

/**
 * PÁGINA DE REGISTRO DE USUARIOS
 * 
 * Esta página maneja el registro de nuevos usuarios:
 * - Formulario de registro con validación
 * - Verificación de email único
 * - Redirección a login tras registro exitoso
 * - Navegación de vuelta a login
 */
@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class RegisterPage {
  // Formulario reactivo para el registro
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    // Configurar formulario con validaciones
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  /**
   * PROCESO DE REGISTRO DE USUARIO
   * 
   * Esta función maneja el registro de nuevos usuarios:
   * 1. Valida el formulario
   * 2. Verifica que el email no exista
   * 3. Registra el usuario en el sistema
   * 4. Muestra mensajes de éxito/error
   * 5. Redirige a login si es exitoso
   */
  async onRegister() {
    console.log('onRegister()', this.registerForm.value);

    // Validar formulario antes de proceder
    if (this.registerForm.invalid) {
      const t = await this.toastCtrl.create({
        message: 'Completa los datos correctamente',
        duration: 1500,
        color: 'warning'
      });
      await t.present();
      return;
    }

    const { email, password } = this.registerForm.value;
    
    // Intentar registro del usuario
    const success = await this.authService.register(email, password);

    if (success) {
      // Registro exitoso - mostrar mensaje y redirigir a login
      const toast = await this.toastCtrl.create({
        message: 'Usuario registrado correctamente',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
      this.navCtrl.navigateRoot('/login');
    } else {
      // Registro fallido - usuario ya existe
      const toast = await this.toastCtrl.create({
        message: 'El usuario ya existe',
        duration: 1800,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * NAVEGACIÓN A LOGIN
   * 
   * Redirige al usuario de vuelta a la página de login
   */
  goToLogin() {
    // Usamos NavController para volver a la página de login.
    this.navCtrl.navigateBack('/login');
  }
}