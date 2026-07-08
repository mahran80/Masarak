import { Injectable, signal, computed } from '@angular/core';
import { ChatMessage } from '../models/message';
import { ChatRoom, ChatRoomGroup } from '../models/SendMessageDto';

@Injectable({
  providedIn: 'root'
})
export class ChatStore {

  messages = signal<ChatMessage[]>([]);
  rooms = signal<ChatRoom[]>([]);
  selectedRoomId = signal<number | null>(null);

  groupedRooms = computed<ChatRoomGroup[]>(() => {
    const allRooms = this.rooms();
    const groups: { [key: string]: ChatRoom[] } = {};
    
    for (const room of allRooms) {
      let groupName = 'أخرى';
      if (room.roomType === 'GradeCommunity') groupName = 'مجتمعات المراحل الدراسية';
      else if (room.roomType === 'TeachersCommunity') groupName = 'مجتمع المعلمين';
      else if (room.roomType === 'ClassCommunity') groupName = 'الفصول الدراسية';
      else if (room.roomType === 'ParentCommunity') groupName = 'مجتمع أولياء الأمور';
      else if (room.roomType === 'General') groupName = 'قنوات عامة';

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(room);
    }

    return Object.keys(groups).map(key => ({
      groupName: key,
      rooms: groups[key]
    }));
  });

  setMessages(messages: ChatMessage[]) {
    this.messages.set(messages);
  }

  addMessage(message: ChatMessage) {
    this.messages.update(msgs => {
      // Prevent duplicates and ensure it's for the selected room
      if (msgs.some(m => m.messageId === message.messageId) || message.chatRoomId !== this.selectedRoomId()) {
        return msgs;
      }
      return [...msgs, message];
    });
  }

  clear() {
    this.messages.set([]);
  }
}