import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { PostReference } from '../services/posts.service';

// muestra el elemento solo si el post tiene una referencia
@Directive({
  selector: '[appHasReference]',
  standalone: true
})
export class HasReferenceDirective {
  private readonly templateRef = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);

  readonly appHasReference = input<PostReference>();

  constructor() {
    effect(() => {
      this.viewContainer.clear();
      if (this.appHasReference()) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
