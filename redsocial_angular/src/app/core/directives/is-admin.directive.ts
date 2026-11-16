import { Directive, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

// muestra el elemento solo si el usuario logueado es admin
@Directive({
  selector: '[appIsAdmin]',
  standalone: true
})
export class IsAdminDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.authService.isAdmin()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
