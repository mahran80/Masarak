import { Component } from '@angular/core';
import { RouterOutlet } from "@angular/router";
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';
import { LoadingOverlayComponent } from './shared/components/loading-overlay/loading-overlay.component';
import { AiAssistantComponent } from './shared/components/ai-assistant/ai-assistant.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
  imports: [RouterOutlet, ToastContainerComponent, LoadingOverlayComponent, AiAssistantComponent]
})
export class App  {

}


