import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CreateUserModalComponent } from './create-user-modal/create-user-modal.component';
import { UsersComponent } from './users/users.component';

@Component({
  selector: 'app-dashboards',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, CreateUserModalComponent],
  templateUrl: './dashboards.component.html',
  styleUrl: './dashboards.component.scss'
})
export class DashboardsComponent {
  modalOpen = signal(false);

  // componente que está mostrando el router-outlet
  private currentPage: unknown;

  onActivate(page: unknown): void {
    this.currentPage = page;
  }

  // si se está viendo el listado se vuelve a la primera página para que aparezca el nuevo
  onCreated(): void {
    this.modalOpen.set(false);
    if (this.currentPage instanceof UsersComponent) {
      this.currentPage.page.set(0);
      this.currentPage.loadUsers();
    }
  }
}
