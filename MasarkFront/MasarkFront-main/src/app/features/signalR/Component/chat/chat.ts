import { Component, OnInit, OnDestroy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatApiService } from '../../services/chat-api-service';
import { ChatSignalRService } from '../../../../core/services/signalr';
import { ChatStore } from '../../services/chat.store';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule, CommonModule, IconComponent],
  templateUrl: './chat.html',
  styleUrls: ['./chat.css']
})
export class Chat implements OnInit, OnDestroy {
  private api = inject(ChatApiService);
  private signalr = inject(ChatSignalRService);
  store = inject(ChatStore);
  authState = inject(AuthStateService);

  message = '';
  private messageSub?: Subscription;

  get currentUserId(): number {
    return this.authState.user()?.userId || 0;
  }

  selectedRoom = computed(() => {
    const roomId = this.store.selectedRoomId();
    return this.store.rooms().find(r => r.chatRoomId === roomId);
  });

  async ngOnInit() {
    const token = localStorage.getItem('masarak_access_token')!;

    try {
      this.api.getRooms().subscribe({
        next: async (rooms) => {
          this.store.rooms.set(rooms);
          if (rooms && rooms.length > 0) {
            await this.signalr.startConnection(token);
            this.selectRoom(rooms[0].chatRoomId);

            this.messageSub = this.signalr.messages$.subscribe((msg) => {
              if (!msg) return;
              this.store.addMessage(msg);
            });
          }
        },
        error: (err) => console.error('Failed to load chat rooms:', err)
      });
    } catch (err: any) {
      console.error('Failed to initialize chat connection:', err);
    }
  }

  async selectRoom(roomId: number) {
    if (this.store.selectedRoomId() === roomId) return;

    const oldRoomId = this.store.selectedRoomId();
    if (oldRoomId) {
      await this.signalr.leaveRoom(oldRoomId);
    }

    this.store.selectedRoomId.set(roomId);
    this.store.clear();
    
    await this.signalr.joinRoom(roomId);
    this.loadMessages();
  }

  ngOnDestroy() {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
    const currentRoom = this.store.selectedRoomId();
    if (currentRoom) {
      this.signalr.leaveRoom(currentRoom);
    }
  }

  loadMessages() {
    const roomId = this.store.selectedRoomId();
    if (!roomId) return;
    this.api.getMessages(roomId).subscribe({
      next: (res) => this.store.setMessages(res.items),
      error: (err) => console.error('LOAD ERROR', err),
    });
  }

  handleEnter(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (!keyboardEvent.shiftKey) {
      keyboardEvent.preventDefault();
      this.send();
    }
  }

  send() {
    const roomId = this.store.selectedRoomId();
    if (!this.message.trim() || !roomId) return;
    this.signalr.sendMessage(roomId, this.message);
    this.message = '';
  }
}
