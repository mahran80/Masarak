import { Component, OnInit, OnDestroy, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ChatApiService } from '../../services/chat-api-service';
import { ChatSignalRService } from '../../../../core/services/signalr';
import { ChatStore } from '../../services/chat.store';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

const AR = {
  PAGE_BADGE: "التواصل",
  PAGE_TITLE: "المحادثات والقنوات",
  PAGE_DESC: "تواصل مع إدارة المدرسة والمعلمين وتابع المحادثات الأكاديمية من مكان واحد.",
  CHANNELS_TITLE: "المحادثات والقنوات",
  CHANNELS_DESC: "تواصل مع المدرسة والمعلمين",
  EMPTY_CHANNELS_TITLE: "لا توجد قنوات متاحة",
  EMPTY_CHANNELS_DESC: "ستظهر القنوات التعليمية المتاحة لك هنا.",
  EMPTY_CONV_TITLE: "ابدأ محادثتك التعليمية",
  EMPTY_CONV_DESC: "اختر قناة من القائمة للتواصل مع المدرسة أو المعلمين ومتابعة كل جديد.",
  SEND_HINT: "الإرسال",
  SEND_KEY: "Enter",
  WRITE_MSG_PREFIX: "اكتب رسالة في #",
  SENDER_YOU: "أنت",
  NO_MESSAGES: "لا توجد رسائل سابقة. كن أول من يشارك!",
  ROOM_GRADE: "مجتمع المرحلة الدراسية",
  ROOM_TEACHER: "مجتمع المعلمين",
  ROOM_DEFAULT: "مجموعة التواصل"
};

const EN = {
  PAGE_BADGE: "Communication",
  PAGE_TITLE: "Chats & Channels",
  PAGE_DESC: "Communicate with school administration and teachers, and keep track of academic chats all in one place.",
  CHANNELS_TITLE: "Chats & Channels",
  CHANNELS_DESC: "Communicate with school and teachers",
  EMPTY_CHANNELS_TITLE: "No channels available",
  EMPTY_CHANNELS_DESC: "Available educational channels will appear here.",
  EMPTY_CONV_TITLE: "Start Your Educational Conversation",
  EMPTY_CONV_DESC: "Select a channel from the list to communicate with the school or teachers and follow all updates.",
  SEND_HINT: "to send",
  SEND_KEY: "Enter",
  WRITE_MSG_PREFIX: "Write a message in #",
  SENDER_YOU: "You",
  NO_MESSAGES: "No messages yet. Be the first to share!",
  ROOM_GRADE: "Grade Community",
  ROOM_TEACHER: "Teacher Community",
  ROOM_DEFAULT: "Communication Group"
};

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

  lang = signal<'ar' | 'en'>('ar');
  t = computed(() => this.lang() === 'ar' ? AR : EN);
  private observer?: MutationObserver;

  isLoading = signal<boolean>(false);
  isSending = signal<boolean>(false);
  error = signal<string | null>(null);
  sendError = signal<string | null>(null);
  imageFailed = signal<boolean>(false);

  get currentUserId(): number {
    return this.authState.user()?.userId || 0;
  }

  selectedRoom = computed(() => {
    const roomId = this.store.selectedRoomId();
    return this.store.rooms().find(r => r.chatRoomId === roomId);
  });

  async ngOnInit() {
    this.loadRooms();

    if (typeof window !== 'undefined') {
      // Detect language from HTML dir attribute reactively
      const savedLang = localStorage.getItem('lang') as 'ar' | 'en';
      if (savedLang) {
        this.lang.set(savedLang);
      } else {
        const dir = document.documentElement.getAttribute('dir');
        this.lang.set(dir === 'ltr' ? 'en' : 'ar');
      }

      this.observer = new MutationObserver(() => {
        const currentLang = document.documentElement.getAttribute('dir') === 'rtl' ? 'ar' : 'en';
        if (this.lang() !== currentLang) {
          this.lang.set(currentLang);
        }
      });
      this.observer.observe(document.documentElement, { attributes: true, attributeFilter: ['dir'] });
    }
  }

  loadRooms() {
    this.isLoading.set(true);
    this.error.set(null);
    const token = localStorage.getItem('masarak_access_token')!;

    this.api.getRooms().subscribe({
      next: async (rooms) => {
        this.store.rooms.set(rooms);
        this.isLoading.set(false);
        if (rooms && rooms.length > 0) {
          await this.signalr.startConnection(token);
          const teachersRoom = this.authState.isTeacher()
            ? rooms.find(room => room.roomType === 'TeachersCommunity')
            : undefined;
          await this.selectRoom((teachersRoom ?? rooms[0]).chatRoomId);

          this.messageSub = this.signalr.messages$.subscribe((msg) => {
            if (!msg) return;
            this.store.addMessage(msg);
          });
        }
      },
      error: (err) => {
        console.error('Failed to load chat rooms:', err);
        this.error.set(this.lang() === 'ar' ? 'تعذر تحميل قائمة القنوات. يرجى المحاولة مرة أخرى.' : 'Failed to load channels list. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  async selectRoom(roomId: number) {
    if (this.store.selectedRoomId() === roomId) return;

    const oldRoomId = this.store.selectedRoomId();
    if (oldRoomId) {
      await this.signalr.leaveRoom(oldRoomId);
    }

    this.store.selectedRoomId.set(roomId);
    this.store.clear();
    
    try {
      await this.signalr.joinRoom(roomId);
      this.loadMessages();
    } catch (err) {
      console.error('Failed to join chat room:', err);
      this.sendError.set(this.lang() === 'ar'
        ? 'تعذر الاتصال بالمحادثة. تأكد من تشغيل الخادم ثم حاول مرة أخرى.'
        : 'Could not connect to the chat. Make sure the server is running and try again.');
    }
  }

  ngOnDestroy() {
    if (this.messageSub) {
      this.messageSub.unsubscribe();
    }
    const currentRoom = this.store.selectedRoomId();
    if (currentRoom) {
      this.signalr.leaveRoom(currentRoom);
    }
    if (this.observer) {
      this.observer.disconnect();
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

  async send() {
    const roomId = this.store.selectedRoomId();
    const content = this.message.trim();
    if (!content || !roomId || this.isSending()) return;

    this.isSending.set(true);
    this.sendError.set(null);
    try {
      await this.signalr.sendMessage(roomId, content);
      this.message = '';
    } catch (err) {
      console.error('Failed to send chat message:', err);
      this.sendError.set(this.lang() === 'ar'
        ? 'لم يتم إرسال الرسالة. حاول مرة أخرى.'
        : 'The message was not sent. Please try again.');
    } finally {
      this.isSending.set(false);
    }
  }
}
