import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';

import {
  PAYMENT_RECORDS,
  ACTIVE_SUBSCRIPTIONS_COUNT,
  MONTHLY_REVENUE
} from './subscriptions.mock';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, IconComponent, DecimalPipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminSubscriptionsComponent {

  readonly activeCount = ACTIVE_SUBSCRIPTIONS_COUNT;
  readonly monthlyRevenue = MONTHLY_REVENUE;
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = 10;

  private readonly records = signal(PAYMENT_RECORDS);

  readonly filteredRecords = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.records();
    }
    return this.records().filter(record =>
      record.studentName.toLowerCase().includes(term)
    );
  });
}