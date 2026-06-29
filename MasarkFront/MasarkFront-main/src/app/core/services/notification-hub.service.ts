import { Injectable, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../environments/environment';
import { NotificationDto } from '../../models/notification.model';
import { NotificationService } from './notification.service';
import { AuthStateService } from './auth-state-service';

@Injectable({ providedIn: 'root' })
export class NotificationHubService {
  private hubConnection?: signalR.HubConnection;
  private readonly notificationService = inject(NotificationService);
  private readonly authState = inject(AuthStateService);

  startConnection() {
    const token = this.authState.accessToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/notifications`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
      this.notificationService.pushIncoming(notification);
    });

    this.hubConnection.start()
      .then(() => console.log('NotificationHub connected'))
      .catch(err => console.error('Error while starting NotificationHub connection', err));
  }

  stopConnection() {
    this.hubConnection?.stop();
  }
}
