import {
  afterNextRender,
  Component,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer.mjs';
import { PdfService } from '../pdf.service';

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

  constructor() {
    afterNextRender(() => {
      const eventBus = new pdfjsViewer.EventBus();
      this.pdfLinkService = new pdfjsViewer.PDFLinkService({
        eventBus: eventBus,
      });
      const pdfFindController = new pdfjsViewer.PDFFindController({
        eventBus: eventBus,
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
        eventBus: eventBus,
        linkService: this.pdfLinkService,
        findController: pdfFindController,
        textLayerMode: 0,
      });

      this.pdfLinkService.setViewer(this.pdfViewer);

      eventBus.on('pagesinit', () => {
        this.pdfViewer.currentScaleValue = 'page-width';
      });
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
}
