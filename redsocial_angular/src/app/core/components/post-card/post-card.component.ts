import { AfterViewInit, Component, ElementRef, Input, ViewChild, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Post } from '../../services/posts.service';

@Component({
  selector: 'app-post-card',
  standalone: true,
  imports: [DatePipe, MatIconModule],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss'
})
export class PostCardComponent implements AfterViewInit {
  @Input({ required: true }) post!: Post;
  @ViewChild('description') description!: ElementRef<HTMLParagraphElement>;

  expanded = signal(false);
  isLong = signal(false);

  ngAfterViewInit(): void {
    // se mide después del render: si el texto no entra en 3 líneas, mostramos "ver más"
    setTimeout(() => {
      const element = this.description.nativeElement;
      this.isLong.set(element.scrollHeight > element.clientHeight);
    });
  }
}
