import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatSignalRService {

  private hubConnection?: signalR.HubConnection;
  private connectionPromise?: Promise<void>;

  messages$ = new BehaviorSubject<any | null>(null);

  userJoined$ = new BehaviorSubject<string | null>(null);

  userLeft$ = new BehaviorSubject<string | null>(null);

  startConnection(token: string): Promise<void> {

    if (this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(
        `${environment.apiUrl.replace('/api', '')}/hubs/chat`,
        {
          accessTokenFactory: () => token
        }
      )
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    this.registerEvents();

    this.connectionPromise = this.hubConnection.start()
      .finally(() => {
        this.connectionPromise = undefined;
      });

    return this.connectionPromise;
  }

  private registerEvents() {

    this.hubConnection?.on(
      'ReceiveMessage',
      message => {
        this.messages$.next(message);
      }
    );

    this.hubConnection?.on(
      'UserJoined',
      username => {
        this.userJoined$.next(username);
      }
    );

    this.hubConnection?.on(
      'UserLeft',
      username => {
        this.userLeft$.next(username);
      }
    );
  }

  joinRoom(roomId: number): Promise<void> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject(new Error('Chat connection is not ready.'));
    }
    return this.hubConnection.invoke(
      'JoinRoom',
      roomId
    );
  }

  leaveRoom(roomId: number): Promise<void> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      return Promise.resolve();
    }
    return this.hubConnection.invoke(
      'LeaveRoom',
      roomId
    );
  }

  sendMessage(
    roomId: number,
    content: string
  ): Promise<void> {
    if (this.hubConnection?.state !== signalR.HubConnectionState.Connected) {
      return Promise.reject(new Error('Chat connection is not ready.'));
    }
    return this.hubConnection.invoke(
      'SendMessage',
      roomId,
      content
    );
  }

  stopConnection() {
    return this.hubConnection?.stop();
  }
}
