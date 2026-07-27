import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal, ViewEncapsulation } from '@angular/core';
import { DecimalPipe, NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AdminApiService } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-admin-subscriptions',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule, IconComponent, DecimalPipe, DatePipe],
  templateUrl: './subscriptions.component.html',
  styleUrl: './subscriptions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class AdminSubscriptionsComponent implements OnInit {

  private readonly adminApi = inject(AdminApiService);

  readonly activeCount = signal(0);
  readonly monthlyRevenue = signal(0);
  readonly searchTerm = signal('');
  readonly currentPage = signal(1);
  readonly totalPages = 1;
  readonly openMenuId = signal<string | number | null>(null);

  private readonly records = signal<any[]>([]);

  readonly filteredRecords = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.records();
    }
    return this.records().filter(record =>
      record.studentName.toLowerCase().includes(term)
    );
  });

  toggleMenu(id: string | number) {
    this.openMenuId.set(this.openMenuId() === id ? null : id);
  }

  closeMenus() {
    this.openMenuId.set(null);
  }

  ngOnInit() {
    this.adminApi.getSubscriptionsDashboard().subscribe(data => {
      this.activeCount.set(data.activeSubscriptionsCount);
      this.monthlyRevenue.set(data.monthlyRevenue);
      this.records.set(data.recentRecords);
    });
  }
}