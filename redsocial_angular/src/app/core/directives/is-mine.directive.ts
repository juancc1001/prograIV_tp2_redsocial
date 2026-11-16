import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../services/auth.service';

// muestra el elemento solo si el username recibido es el del usuario logueado
@Directive({
  selector: '[appIsMine]',
  standalone: true
})
export class IsMineDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  readonly appIsMine = input.required<string>();
  //recibe nombre de usuario y lo compara con el del token
  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.appIsMine() === this.authService.username()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
