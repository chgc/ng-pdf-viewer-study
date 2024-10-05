import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { PdfService } from '../pdf.service';
import { PDFDocumentProxy } from 'pdfjs-dist';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [],
  templateUrl: './viewer.component.html',
  styleUrl: './viewer.component.css',
})
export class ViewerComponent {
  container = viewChild('viewerContainer', { read: ElementRef });
  service = inject(PdfService);

  pdfViewer!: pdfjsViewer.PDFViewer;
  pdfLinkService!: pdfjsViewer.PDFLinkService;
  eventBus!: pdfjsViewer.EventBus;
  currentPage = signal(0);
  totalPages = signal(0);

  renderRef = effect(() => {
    const currentPage = this.currentPage();
    if (currentPage >= 1 && currentPage <= this.pdfViewer.pagesCount) {
      this.pdfViewer.scrollPageIntoView({ pageNumber: currentPage });
    }
  });

  constructor() {
    afterNextRender(() => {
      this.eventBus = new pdfjsViewer.EventBus();
      this.pdfLinkService = new pdfjsViewer.PDFLinkService({
        eventBus: this.eventBus,
      });
      const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus: this.eventBus,
        linkService: this.pdfLinkService,
      });

      this.container()?.nativeElement.addEventListener(
        'contextmenu',
        (event: any) => {
          event.preventDefault();
        }
      );

      this.pdfViewer = new pdfjsViewer.PDFViewer({
        container: this.container()?.nativeElement,
        eventBus: this.eventBus,
        linkService: this.pdfLinkService,
        findController: pdfFindController,
        textLayerMode: 0,
      });

      this.pdfLinkService.setViewer(this.pdfViewer);

      this.eventBus.on('pagesinit', () => {
        this.pdfViewer.currentScaleValue = 'page-width';
        this.currentPage.set(this.pdfViewer.currentPageNumber);
        this.totalPages.set(this.pdfViewer.pagesCount);
      });
      this.eventBus.on('pagechanging', this.onPageChanging.bind(this));
    });
  }

  load() {
    this.service.getPdf().subscribe({
      next: (pdf) => {
        this.pdfViewer.setDocument(pdf);
        this.pdfLinkService.setDocument(pdf, null);
      },
    });
  }

  find() {
    // only works in textLayerMode: 1 (enable)
    this.eventBus.dispatch('find', {
      source: this,
      type: 'again',
      query: 'Arrays',
      highlightAll: true,
      findPrevious: false,
    });
  }

  onPageChanging({ pageNumber }: { pageNumber: number }) {
    untracked(() => {
      this.currentPage.set(pageNumber);
    });
  }

  prevPage() {
    if (this.currentPage() === 1) return;
    this.currentPage.update((page) => page - 1);
  }

  nextPage() {
    if (this.currentPage() >= this.pdfViewer.pagesCount) return;
    this.currentPage.update((page) => page + 1);
  }
}
