import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import * as pdfjs from 'pdfjs-dist';

import { concatMap } from 'rxjs';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

@Injectable({
  providedIn: 'root',
})
export class PdfService {
  http = inject(HttpClient);

  getPdf() {
    return this.http
      .get('./PDF.pdf', { responseType: 'blob' })
      .pipe(
        concatMap((blob) =>
          blob.arrayBuffer().then((source) => pdfjs.getDocument(source).promise)
        )
      );
  }
}
