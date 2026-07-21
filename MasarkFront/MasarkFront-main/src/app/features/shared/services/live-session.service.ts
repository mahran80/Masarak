import { Injectable, signal, computed, inject } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { AuthStateService } from '../../../core/services/auth-state-service';

export interface Participant {
  uid: string;
  name: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class LiveSessionService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly authState = inject(AuthStateService);

  // Roster State
  readonly participants = signal<Participant[]>([]);
  
  // Whiteboard State
  readonly whiteboardActive = signal<boolean>(false);
  readonly whiteboardDrawEvents = signal<any>(null);
  readonly whiteboardClearEvents = signal<number>(0);
  readonly whiteboardWritableUsers = signal<string[]>([]);
  
  // Screen Share State
  readonly screenShareActive = signal<boolean>(false);
  readonly screenShareUid = signal<string | null>(null);

  async joinSession(sessionId: string): Promise<void> {
    const token = this.authState.accessToken();
    if (!token) return;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${environment.apiUrl.replace('/api', '')}/hubs/live-session`, {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    this.registerHandlers();

    try {
      await this.hubConnection.start();
      await this.hubConnection.invoke('JoinSession', parseInt(sessionId, 10));
    } catch (err) {
      console.error('Error while starting LiveSession SignalR connection: ', err);
    }
  }

  async leaveSession(sessionId: string): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.invoke('LeaveSession', parseInt(sessionId, 10));
        await this.hubConnection.stop();
      } catch (err) {
        console.error('Error while stopping LiveSession SignalR connection: ', err);
      }
    }
  }

  private registerHandlers(): void {
    if (!this.hubConnection) return;

    this.hubConnection.on('ExistingParticipants', (users: Participant[]) => {
      // Because names can be camelCase or PascalCase depending on SignalR config, normalize them
      const normalizedUsers = users.map(u => ({
        uid: (u as any).uid || (u as any).Uid,
        name: (u as any).name || (u as any).Name,
        role: (u as any).role || (u as any).Role
      }));
      this.participants.set(normalizedUsers);
    });

    this.hubConnection.on('UserJoined', (user: Participant) => {
      const normalizedUser = {
        uid: (user as any).uid || (user as any).Uid,
        name: (user as any).name || (user as any).Name,
        role: (user as any).role || (user as any).Role
      };
      
      this.participants.update(users => {
        if (!users.find(u => u.uid === normalizedUser.uid)) {
          return [...users, normalizedUser];
        }
        return users;
      });
    });

    this.hubConnection.on('UserLeft', (uid: string) => {
      this.participants.update(users => users.filter(u => u.uid !== uid));
    });

    this.hubConnection.on('OnWhiteboardDraw', (drawData: any) => {
      this.whiteboardDrawEvents.set(drawData);
    });

    this.hubConnection.on('OnWhiteboardClear', () => {
      this.whiteboardClearEvents.update(c => c + 1);
    });

    this.hubConnection.on('OnWhiteboardToggled', (isActive: boolean) => {
      this.whiteboardActive.set(isActive);
    });

    this.hubConnection.on('WhiteboardAccessGranted', (uid: string) => {
      this.whiteboardWritableUsers.update(users => [...users, uid]);
    });

    this.hubConnection.on('WhiteboardAccessRevoked', (uid: string) => {
      this.whiteboardWritableUsers.update(users => users.filter(u => u !== uid));
    });
  }

  // --- Actions ---
  async toggleWhiteboard(sessionId: string, isActive: boolean): Promise<void> {
    await this.hubConnection?.invoke('ToggleWhiteboard', parseInt(sessionId, 10), isActive);
  }

  async drawWhiteboard(sessionId: string, drawData: any): Promise<void> {
    await this.hubConnection?.invoke('DrawWhiteboard', parseInt(sessionId, 10), drawData);
  }

  async clearWhiteboard(sessionId: string): Promise<void> {
    await this.hubConnection?.invoke('ClearWhiteboard', parseInt(sessionId, 10));
  }

  async grantWhiteboardAccess(sessionId: string, uid: string): Promise<void> {
    await this.hubConnection?.invoke('GrantWhiteboardAccess', parseInt(sessionId, 10), uid);
  }

  async revokeWhiteboardAccess(sessionId: string, uid: string): Promise<void> {
    await this.hubConnection?.invoke('RevokeWhiteboardAccess', parseInt(sessionId, 10), uid);
  }
}
