import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Verificar si hay un usuario logueado usando el AuthService
  const currentUser = authService.getCurrentUser();
  
  if (!currentUser) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};