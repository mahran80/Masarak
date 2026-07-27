import { Component, OnInit } from '@angular/core';
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
export class App implements OnInit {
  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
          document.body.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
          document.body.classList.remove('dark');
        }
      }
    }
  }
}
