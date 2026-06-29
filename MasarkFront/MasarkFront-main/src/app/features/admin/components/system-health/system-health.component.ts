import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AdminApiService, SystemHealthDto } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [NgFor, NgIf, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './system-health.component.html',
  styleUrl: './system-health.component.scss'
})
export class SystemHealthComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  readonly queueDepth = signal(0);
  readonly signalRConnections = signal(0);
  readonly activeJobs = signal<any[]>([]);
  readonly recentErrors = signal<any[]>([]);
  readonly metrics = signal<any[]>([]);

  ngOnInit() {
    this.adminApi.getSystemHealth().subscribe(data => {
      this.metrics.set([
        { label: 'إجمالي المستخدمين', value: data.totalUsers, icon: 'users', color: 'blue', statusLabel: 'مستقر', statusColor: 'green' },
        { label: 'المستخدمين النشطين', value: data.activeUsers, icon: 'activity', color: 'emerald', statusLabel: 'نشط', statusColor: 'green' },
        { label: 'الإشعارات', value: data.totalNotifications, icon: 'bell', color: 'purple', statusLabel: 'يعمل', statusColor: 'green' },
        { label: 'الاشتراكات النشطة', value: data.activeSubscriptions, icon: 'credit-card', color: 'amber', statusLabel: 'طبيعي', statusColor: 'green' },
        { label: 'المحتوى', value: data.totalContentItems, icon: 'book', color: 'indigo', statusLabel: 'طبيعي', statusColor: 'green' },
        { label: 'الجلسات', value: data.totalSessions, icon: 'video', color: 'rose', statusLabel: 'نشط', statusColor: 'green' }
      ]);
      
      this.queueDepth.set(0); // Assuming 0 as it's not provided by backend, or we could fetch it if added later
      this.signalRConnections.set(0); 

      // Transform strings to object for the view
      this.recentErrors.set((data.recentErrors || []).map(err => ({ message: err, time: 'الآن' })));
    });
  }
}