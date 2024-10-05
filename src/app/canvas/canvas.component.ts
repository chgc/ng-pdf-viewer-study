import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { PdfService } from '../pdf.service';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent {
  service = inject(PdfService);
  pdfViewer = viewChild('pdfViewer', { read: ElementRef });

  pdfDoc = signal<PDFDocumentProxy | undefined>(undefined);
  ctx = computed(() =>
    this.pdfViewer()
      ? this.pdfViewer()?.nativeElement.getContext('2d')
      : undefined
  );
  pageRendering = signal(false);
  pageNumPending = signal<number | null>(null);
  pageNumber = computed(() => this.pdfDoc()?.numPages ?? 0);
  currentPage = signal(1);

  renderRef = effect(() => {
    const currentPage = this.currentPage();
    if (currentPage >= 1 && currentPage <= (this.pageNumber() ?? 0)) {
      this.renderPage(currentPage);
    }
  });

  title = 'pdfviewer';

  constructor() {
    afterNextRender(() => {
      const canvas = this.pdfViewer()?.nativeElement;
      canvas.addEventListener('contextmenu', (event: any) => {
        event.preventDefault();
      });
    });
  }

  load() {
    this.service.getPdf().subscribe({
      next: (pdf) => {
        this.pdfDoc.set(pdf);
        this.currentPage.set(1);
      },
    });
  }

  prevPage() {
    if (this.currentPage() === 1) return;
    this.currentPage.update((page) => page - 1);
  }
  nextPage() {
    if (this.currentPage() >= this.pageNumber()) return;
    this.currentPage.update((page) => page + 1);
  }

  renderPage(num: number) {
    const canvas = this.pdfViewer()?.nativeElement;
    if (canvas === undefined) return;
    this.pdfDoc()
      ?.getPage(num)
      .then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: this.ctx(),
          viewport: viewport,
        };
        const renderTask = page.render(renderContext);

        renderTask.promise.then(() => {
          this.pageRendering.set(false);
          if (this.pageNumPending() !== null) {
            this.renderPage(this.pageNumPending()!);
            this.pageNumPending.set(null);
          }
        });
      });
  }
}
