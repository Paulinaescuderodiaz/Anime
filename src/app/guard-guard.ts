import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Verificar si hay un usuario logueado usando el AuthService
  const currentUser = authService.getCurrentUser();
  console.log('AuthGuard - Current user:', currentUser);
  
  if (!currentUser) {
    console.log('AuthGuard - No user found, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  console.log('AuthGuard - User authenticated, allowing access');
  return true;
};