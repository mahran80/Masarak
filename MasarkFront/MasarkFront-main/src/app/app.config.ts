import { ApplicationConfig, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { routes } from './app.routes';
import { ChatSignalRService } from './core/services/signalr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { NotificationHubService } from './core/services/notification-hub.service';
import { CustomTitleStrategy } from './core/services/custom-title-strategy';

export function initializeSignalR(signalrService: ChatSignalRService) {
  return () => {
    // Service initialization
  };
}

export function initializeNotificationHub(notificationHub: NotificationHubService) {
  return () => {
    notificationHub.startConnection();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])),
    {
      provide: TitleStrategy,
      useClass: CustomTitleStrategy,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeSignalR,
      deps: [ChatSignalRService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeNotificationHub,
      deps: [NotificationHubService],
      multi: true,
    },
  ],
};
