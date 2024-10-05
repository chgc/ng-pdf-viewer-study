import { Routes } from '@angular/router';
import { CanvasComponent } from './canvas/canvas.component';
import { ViewerComponent } from './viewer/viewer.component';

export const routes: Routes = [
  { path: 'canvas', component: CanvasComponent },
  { path: 'pdf', component: ViewerComponent },
  { path: '**', redirectTo: '/pdf' },
];
