import { Routes } from '@angular/router';
import { authGuard } from './guard-guard';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'anime-detail/:id',
    loadComponent: () => import('./anime-detail/anime-detail.page').then((m) => m.AnimeDetailPage),
    canActivate: [authGuard]
  },
  {
    path: 'add-review',
    loadComponent: () => import('./add-review/add-review.page').then((m) => m.AddReviewPage),
    canActivate: [authGuard]
  },
  {
    path: 'my-reviews',
    loadComponent: () => import('./my-reviews/my-reviews.page').then((m) => m.MyReviewsPage),
    canActivate: [authGuard]
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then( m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
    
  }
];
