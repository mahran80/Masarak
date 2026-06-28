import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { PLATFORM_SUBJECTS, PlatformSubject } from './content.mock';
import { AdminApiService } from '../../../../core/services/admin-api-service';

@Component({
  selector: 'app-admin-content',
  standalone: true,
  imports: [NgFor, NgIf, IconComponent, ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './content.component.html',
  styleUrl: './content.component.scss'
})
export class AdminContentComponent {
  private readonly adminApi = inject(AdminApiService);
  
  readonly subjects = signal<PlatformSubject[]>(PLATFORM_SUBJECTS);

  archive(id: number): void {
    console.log('Archive Subject:', id);
  }

  remove(id: number): void {
    this.adminApi.moderateContentItem(id, 'Inappropriate content').subscribe({
      next: () => {
        // Remove from UI after successful backend call
        this.subjects.update(subs => subs.filter(s => s.id !== id));
      }
    });
  }
}