import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./layouts/gmail-layout/gmail-layout.component').then(m => m.GmailLayoutComponent),
    children: [
      { 
        path: '', 
        loadComponent: () => import('./components/inbox/inbox.component').then(m => m.InboxComponent) 
      },
      { 
        path: 'attachments', 
        loadComponent: () => import('./pages/attachments/attachments.component').then(m => m.AttachmentsComponent) 
      },
      { 
        path: 'settings', 
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) 
      },
    ]
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
  { path: '**', redirectTo: '' }
];
