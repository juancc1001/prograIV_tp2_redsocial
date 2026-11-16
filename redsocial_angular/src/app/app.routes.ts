import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', canActivate: [authGuard], loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'new-post', canActivate: [authGuard], loadComponent: () => import('./pages/new-post/new-post.component').then(m => m.NewPostComponent) },
  { path: 'edit-profile', canActivate: [authGuard], loadComponent: () => import('./pages/edit-profile/edit-profile.component').then(m => m.EditProfileComponent) },
  { path: 'post/:id', canActivate: [authGuard], loadComponent: () => import('./pages/post/post.component').then(m => m.PostComponent) },
  {
    path: 'dashboards',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboards/dashboards.component').then(m => m.DashboardsComponent),
    children: [
      { path: '', redirectTo: 'users', pathMatch: 'full' },
      { path: 'users', loadComponent: () => import('./pages/dashboards/users/users.component').then(m => m.UsersComponent) },
    ],
  },
  { path: ':username', canActivate: [authGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
];
