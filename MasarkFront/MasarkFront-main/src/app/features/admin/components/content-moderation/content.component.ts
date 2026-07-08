import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { AdminApiService } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class AdminContentComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);
  
  readonly contentItems = signal<any[]>([]);

  ngOnInit() {
    this.adminApi.getContentItems().subscribe(data => {
      this.contentItems.set(data);
    });
  }

  archive(id: number): void {
    console.log('Archive Content Item:', id);
  }

  remove(id: number): void {
    this.adminApi.moderateContentItem(id, 'Inappropriate content').subscribe({
      next: () => {
        // Remove from UI after successful backend call
        this.contentItems.update(items => items.filter(i => i.id !== id));
      }
    });
  }
}