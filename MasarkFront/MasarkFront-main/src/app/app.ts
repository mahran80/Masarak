import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [RouterOutlet, ToastContainerComponent, LoadingOverlayComponent, ConfirmDialogComponent]
})
export class App  {

}


