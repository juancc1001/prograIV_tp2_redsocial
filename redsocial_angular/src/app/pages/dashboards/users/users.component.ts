import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserListItem, UsersService } from '../../../core/services/users.service';
import { ErrorService } from '../../../core/services/error.service';
import { LoaderService } from '../../../core/services/loader.service';
import { finalize } from 'rxjs';

const PER_PAGE = 10;

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent {
  private readonly usersService = inject(UsersService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);

  users = signal<UserListItem[]>([]);
  page = signal(0);
  hasMore = signal(false);

  constructor() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loaderService.show();
    this.usersService.getUsers(this.page() * PER_PAGE, PER_PAGE).pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: users => {
        this.users.set(users);
        this.hasMore.set(users.length === PER_PAGE);
      },
      error: error => this.errorService.show(error),
    });
  }

  toggleActive(user: UserListItem): void {
    let request = this.usersService.disableUser(user.username);
    if (!user.isActive) {
      request = this.usersService.enableUser(user.username);
    }

    this.loaderService.show();
    request.pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: updated => {
        // se reemplaza el usuario en la lista con el que devuelve la api
        const users = this.users().map(item => {
          if (item.username === updated.username) {
            return updated;
          }
          return item;
        });
        this.users.set(users);
      },
      error: error => this.errorService.show(error),
    });
  }

  previousPage(): void {
    this.page.set(this.page() - 1);
    this.loadUsers();
  }

  nextPage(): void {
    this.page.set(this.page() + 1);
    this.loadUsers();
  }
}
