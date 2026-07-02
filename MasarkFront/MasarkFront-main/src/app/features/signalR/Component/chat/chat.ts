import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatApiService } from '../../services/chat-api-service';
import { ChatSignalRService } from '../../../../core/services/signalr';
import { ChatStore } from '../../services/chat.store';
import { AuthStateService } from '../../../../core/services/auth-state-service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  private api = inject(ChatApiService);
  private signalr = inject(ChatSignalRService);
  store = inject(ChatStore);
  authState = inject(AuthStateService);

  roomId: number = 0;
  message = '';
  private messageSub?: Subscription;

  get currentUserId(): number {
    return this.authState.user()?.userId || 0;
  }

  async ngOnInit() {
    const token = localStorage.getItem('masarak_access_token')!;

    try {
      // Fetch available rooms for the user first to avoid unauthorized access
      this.api.getRooms().subscribe({
        next: async (rooms) => {
          if (rooms && rooms.length > 0) {
            this.roomId = rooms[0].chatRoomId; // Dynamically assign the first available room

            await this.signalr.startConnection(token);
            await this.signalr.joinRoom(this.roomId);

            this.loadMessages();

            this.messageSub = this.signalr.messages$.subscribe((msg) => {
              if (!msg) return;
              this.store.addMessage(msg);
            });
          } else {
            console.warn('No chat rooms available for this user.');
          }
        },
        error: (err) => console.error('Failed to load chat rooms:', err)
      });
    } catch (err: any) {
      console.error('Failed to initialize chat connection:', err);
    }
  }

  ngOnDestroy() {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
  }

  loadMessages() {
    if (this.roomId === 0) return;
    this.api.getMessages(this.roomId).subscribe({
      next: (res) => {
        console.log('MESSAGES', res);
        this.store.setMessages(res.items);
      },
      error: (err) => {
        console.error('LOAD ERROR', err);
      },
    });
  }

  send() {
    if (!this.message.trim() || this.roomId === 0) return;

    this.signalr.sendMessage(this.roomId, this.message);

    this.message = '';
  }
}
