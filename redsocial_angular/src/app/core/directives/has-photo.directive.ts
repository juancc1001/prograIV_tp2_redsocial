import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';

// muestra el elemento solo si el post tiene foto
@Directive({
  selector: '[appHasPhoto]',
  standalone: true
})
export class HasPhotoDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appHasPhoto = input<string>();

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.appHasPhoto()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
