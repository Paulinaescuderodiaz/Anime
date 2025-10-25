import { Routes } from '@angular/router';
import { authGuard } from './guard-guard';

/**
 * CONFIGURACIÓN DE RUTAS DE LA APLICACIÓN
 * 
 * Este archivo define todas las rutas de la aplicación de anime:
 * 
 * RUTAS PROTEGIDAS (requieren autenticación):
 * - /home: Página principal con lista de animes
 * - /anime-detail/:id: Detalles de un anime específico
 * - /add-review: Crear nueva reseña
 * - /my-reviews: Ver reseñas del usuario actual
 * 
 * RUTAS PÚBLICAS (no requieren autenticación):
 * - /login: Página de inicio de sesión
 * - /register: Página de registro de usuario
 * 
 * RUTA POR DEFECTO:
 * - Redirige a /login si no se especifica ninguna ruta
 */
export const routes: Routes = [
  // === RUTAS PROTEGIDAS (requieren login) ===
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard] // Protegida por guard de autenticación
  },
  {
    path: 'anime-detail/:id',
    loadComponent: () => import('./anime-detail/anime-detail.page').then((m) => m.AnimeDetailPage),
    canActivate: [authGuard] // Protegida por guard de autenticación
  },
  {
    path: 'add-review',
    loadComponent: () => import('./add-review/add-review.page').then((m) => m.AddReviewPage),
    canActivate: [authGuard] // Protegida por guard de autenticación
  },
  {
    path: 'my-reviews',
    loadComponent: () => import('./my-reviews/my-reviews.page').then((m) => m.MyReviewsPage),
    canActivate: [authGuard] // Protegida por guard de autenticación
  },
  
  // === RUTA POR DEFECTO ===
  {
    path: '',
    redirectTo: 'login', // Redirige a login por defecto
    pathMatch: 'full',
  },
  
  // === RUTAS PÚBLICAS (no requieren login) ===
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    
  }
];
