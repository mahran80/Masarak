import { ApplicationConfig, APP_INITIALIZER, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { ChatSignalRService } from './core/services/signalr';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { NotificationHubService } from './core/services/notification-hub.service';

// ميثود لتشغيل الخدمة عند بدء التطبيق
export function initializeSignalR(signalrService: ChatSignalRService) {
  return () => {
    // بمجرد عمل الحقل، الـ Constructor الخاص بالخدمة سيعمل ويبدأ الاتصال
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

    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])),

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
