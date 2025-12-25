import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./pages/index/index.component').then(m => m.IndexComponent) 
  },
  { 
    path: 'user', 
    loadComponent: () => import('./pages/user/user.component').then(m => m.UserComponent) 
  },
  { 
    path: 'user/oauth2/callback', 
    loadComponent: () => import('./views/user/user-oauth2-callback/user-oauth2-callback.component').then(m => m.UserOauth2CallbackComponent) 
  },
  { 
    path: 'admin', 
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) 
  },
  { 
    path: 'telegram_mail', 
    loadComponent: () => import('./views/telegram/mail/mail.component').then(m => m.TelegramMailComponent) 
  },
  // Language prefix routes
  { 
    path: ':lang', 
    loadComponent: () => import('./pages/index/index.component').then(m => m.IndexComponent) 
  },
  { 
    path: ':lang/user', 
    loadComponent: () => import('./pages/user/user.component').then(m => m.UserComponent) 
  },
  { 
    path: ':lang/user/oauth2/callback', 
    loadComponent: () => import('./views/user/user-oauth2-callback/user-oauth2-callback.component').then(m => m.UserOauth2CallbackComponent) 
  },
  { 
    path: ':lang/admin', 
    loadComponent: () => import('./pages/admin/admin.component').then(m => m.AdminComponent) 
  },
  { 
    path: ':lang/telegram_mail', 
    loadComponent: () => import('./views/telegram/mail/mail.component').then(m => m.TelegramMailComponent) 
  },
  { path: '**', redirectTo: '' }
];
