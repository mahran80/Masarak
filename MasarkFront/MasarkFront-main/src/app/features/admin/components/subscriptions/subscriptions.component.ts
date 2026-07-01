import { ChangeDetectionStrategy, Component, computed, signal, OnInit, inject } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

import { SubscriptionApiService } from '../../../../core/services/subscription-api-service';
import { SubscriptionDto } from '../../../../core/models/subscription.model';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, IconComponent, DecimalPipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSubscriptionsComponent implements OnInit {
  private readonly subApi = inject(SubscriptionApiService);

  readonly activeCount = signal<number>(0);
  readonly monthlyRevenue = signal<number>(0);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  private readonly _records = signal<SubscriptionDto[]>([]);

  readonly filteredRecords = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this._records();
    return this._records().filter(r => r.userFullName.toLowerCase().includes(term));
  });

  ngOnInit() {
    this.subApi.getAllSubscriptions({ pageNumber: 1, pageSize: 50 }).subscribe(res => {
      this._records.set(res.items);
      this.activeCount.set(res.items.filter(i => i.status === 'Active').length);
      this.totalPages.set(res.totalPages);
    });
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'Active': return 'نشط';
      case 'Expired': return 'منتهي';
      case 'Cancelled': return 'ملغى';
      default: return 'معلق';
    }
  }
}