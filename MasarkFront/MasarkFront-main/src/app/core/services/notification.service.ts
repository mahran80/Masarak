import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NotificationDto } from '../../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/notifications`;

  private readonly _notifications = signal<NotificationDto[]>([]);

  readonly notifications = computed(() =>
    [...this._notifications()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  );

  readonly unreadCount = computed(() =>
    this._notifications().filter(n => !n.isRead).length
  );

  loadNotifications(): void {
    this.http.get<{ items: NotificationDto[] }>(`${this.baseUrl}?page=1&pageSize=50&unreadOnly=false`).subscribe(res => {
      this._notifications.set(res.items || (res as any as NotificationDto[]) || []);
    });
  }

  markAsRead(id: number): void {
    this.http.put(`${this.baseUrl}/${id}/read`, {}).subscribe(() => {
      this._notifications.update(list =>
        list.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
    });
  }

  markAllAsRead(): void {
    this.http.put(`${this.baseUrl}/read-all`, {}).subscribe(() => {
      this._notifications.update(list =>
        list.map(n => ({ ...n, isRead: true }))
      );
    });
  }

  pushIncoming(notification: NotificationDto): void {
    this._notifications.update(list => [notification, ...list]);
  }

  timeAgo(dateStr: string): string {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    return `منذ ${days} يوم`;
  }
}
