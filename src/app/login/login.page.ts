import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

/**
 * PÁGINA DE INICIO DE SESIÓN
 * 
 * Esta página maneja la autenticación de usuarios:
 * - Formulario de login con validación
 * - Recuperación de contraseña (simulada)
 * - Navegación a registro
 * - Redirección a home tras login exitoso
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,           // para ngModel usado en el modal
    ReactiveFormsModule,   // para formGroup
    IonicModule
  ]
})
export class LoginPage {
  // Formulario reactivo para el login
  loginForm: FormGroup;
  
  // Estado del modal de recuperación de contraseña
  isForgotPasswordModalOpen = false;
  forgotPasswordEmail = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {
    // Configurar formulario con validaciones
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  /**
   * PROCESO DE INICIO DE SESIÓN
   * 
   * Esta función maneja el login del usuario:
   * 1. Valida el formulario
   * 2. Llama al servicio de autenticación
   * 3. Muestra mensajes de éxito/error
   * 4. Navega a home si es exitoso
   */
  async onLogin() {
    console.log('onLogin()', this.loginForm.value);

    // Validar formulario antes de proceder
    if (this.loginForm.invalid) {
      const t = await this.toastCtrl.create({
        message: 'Completa un correo y contraseña válidos',
        duration: 1500,
        color: 'warning'
      });
      await t.present();
      return;
    }

    const { email, password } = this.loginForm.value;
    console.log('Intentando login con:', email);
    
    // Intentar autenticación
    const success = await this.authService.login(email, password);
    console.log('Resultado del login:', success);

    if (success) {
      // Login exitoso - mostrar mensaje y navegar
      const toast = await this.toastCtrl.create({
        message: 'Login exitoso',
        duration: 1000,
        color: 'success'
      });
      await toast.present();
      
      // Navegar inmediatamente después del login exitoso
      console.log('Navegando a home...');
      this.navCtrl.navigateRoot('/home');
    } else {
      // Login fallido - mostrar error
      const toast = await this.toastCtrl.create({
        message: 'Credenciales incorrectas. Si no tienes cuenta, regístrate.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  /**
   * NAVEGACIÓN A REGISTRO
   * 
   * Redirige al usuario a la página de registro
   */
  goToRegister() {
    console.log('goToRegister()');
    this.navCtrl.navigateForward('/register');
  }

  // === FUNCIONES DE RECUPERACIÓN DE CONTRASEÑA ===
  
  /**
   * ABRIR MODAL DE RECUPERACIÓN
   * 
   * Muestra el modal para recuperar contraseña
   */
  openForgotPasswordModal() {
    this.isForgotPasswordModalOpen = true;
  }

  /**
   * CERRAR MODAL DE RECUPERACIÓN
   * 
   * Oculta el modal de recuperación de contraseña
   */
  closeForgotPasswordModal() {
    this.isForgotPasswordModalOpen = false;
  }

  /**
   * ENVIAR EMAIL DE RECUPERACIÓN (SIMULADO)
   * 
   * Esta función simula el envío de un email de recuperación.
   * En una aplicación real, esto conectaría con un servicio de email.
   */
  async sendResetPasswordEmail() {
    // Validar email antes de proceder
    if (!this.forgotPasswordEmail || this.forgotPasswordEmail.indexOf('@') === -1) {
      const toast = await this.toastCtrl.create({
        message: 'Ingresa un correo válido para recuperar contraseña',
        duration: 1800,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Simulación: sólo un toast (en producción se enviaría un email real)
    const toast = await this.toastCtrl.create({
      message: `Se envió un correo de recuperación a ${this.forgotPasswordEmail}`,
      duration: 2000,
      color: 'success'
    });
    await toast.present();

    this.closeForgotPasswordModal();
  }

  /**
   * INICIAR SESIÓN CON GOOGLE
   * 
   * Autentica al usuario usando Google OAuth.
   */
  async onGoogleLogin() {
    try {
      const success = await this.authService.loginWithGoogle();
      
      if (success) {
        const toast = await this.toastCtrl.create({
          message: '¡Bienvenido! Sesión iniciada con Google',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        
        // Navegar a la página principal
        this.navCtrl.navigateRoot('/home');
      } else {
        const toast = await this.toastCtrl.create({
          message: 'Error al iniciar sesión con Google',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
      }
    } catch (error) {
      console.error('Error en login con Google:', error);
      const toast = await this.toastCtrl.create({
        message: 'Error al conectar con Google',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
