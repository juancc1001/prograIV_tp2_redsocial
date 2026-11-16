import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { formatDate } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { Observable, finalize } from 'rxjs';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ErrorService } from '../../../core/services/error.service';
import { LoaderService } from '../../../core/services/loader.service';

// por defecto se muestran los últimos 30 días
function createRange(): FormGroup<{ from: FormControl<string>; to: FormControl<string> }> {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 29);
  return new FormGroup({
    from: new FormControl(formatDate(from, 'yyyy-MM-dd', 'en-US'), { nonNullable: true }),
    to: new FormControl(formatDate(to, 'yyyy-MM-dd', 'en-US'), { nonNullable: true }),
  });
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './stats.component.html',
  styleUrl: './stats.component.scss'
})
export class StatsComponent implements AfterViewInit, OnDestroy {
  private readonly dashboardService = inject(DashboardService);
  private readonly errorService = inject(ErrorService);
  private readonly loaderService = inject(LoaderService);

  @ViewChild('postsPerUserCanvas') postsPerUserCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('commentsPerDayCanvas') commentsPerDayCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('commentsPerPostCanvas') commentsPerPostCanvas!: ElementRef<HTMLCanvasElement>;

  postsPerUserRange = createRange();
  commentsPerDayRange = createRange();
  commentsPerPostRange = createRange();

  private postsPerUserChart!: Chart;
  private commentsPerDayChart!: Chart;
  private commentsPerPostChart!: Chart;

  // los canvas recién existen después de renderizar la vista
  ngAfterViewInit(): void {
    this.postsPerUserChart = new Chart(this.postsPerUserCanvas.nativeElement, {
      type: 'bar',
      data: { labels: [], datasets: [{ label: 'Publicaciones', data: [] }] },
    });
    this.commentsPerDayChart = new Chart(this.commentsPerDayCanvas.nativeElement, {
      type: 'line',
      data: { labels: [], datasets: [{ label: 'Comentarios', data: [] }] },
    });
    this.commentsPerPostChart = new Chart(this.commentsPerPostCanvas.nativeElement, {
      type: 'pie',
      data: { labels: [], datasets: [{ label: 'Comentarios', data: [] }] },
    });

    this.loadPostsPerUser();
    this.loadCommentsPerDay();
    this.loadCommentsPerPost();
  }

  ngOnDestroy(): void {
    this.postsPerUserChart.destroy();
    this.commentsPerDayChart.destroy();
    this.commentsPerPostChart.destroy();
  }

  loadPostsPerUser(): void {
    const { from, to } = this.postsPerUserRange.getRawValue();
    this.load(this.dashboardService.getPostsPerUser(from, to), this.postsPerUserChart, row => row.username);
  }

  loadCommentsPerDay(): void {
    const { from, to } = this.commentsPerDayRange.getRawValue();
    this.load(this.dashboardService.getCommentsPerDay(from, to), this.commentsPerDayChart, row => row.date);
  }

  loadCommentsPerPost(): void {
    const { from, to } = this.commentsPerPostRange.getRawValue();
    this.load(this.dashboardService.getCommentsPerPost(from, to), this.commentsPerPostChart, row => row.label);
  }

  // pide los datos y reemplaza las etiquetas y valores del gráfico
  private load<T extends { count: number }>(request: Observable<T[]>, chart: Chart, getLabel: (row: T) => string): void {
    this.loaderService.show();
    request.pipe(
      finalize(() => this.loaderService.hide())
    ).subscribe({
      next: rows => {
        chart.data.labels = rows.map(getLabel);
        chart.data.datasets[0].data = rows.map(row => row.count);
        chart.update();
      },
      error: error => this.errorService.show(error),
    });
  }
}
