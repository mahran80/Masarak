import { IconComponent } from '../../../shared/components/icon/icon.component';
import { Component, OnInit, OnDestroy, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../../core/services/admin-api-service';

interface Activity {
  fullName: string;
  role: string;
  createdAt: string;
}

interface DashboardData {
  totalStudents: number;
  activeTeachers: number;
  totalRevenue: number;
  recentActivities: Activity[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [IconComponent, CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
  encapsulation: ViewEncapsulation.None
})
export class AdminComponent implements OnInit, OnDestroy {
  private readonly adminApi = inject(AdminApiService);

  data = signal<DashboardData | null>(null);
  isLoading = signal<boolean>(true);

  // Hero Slider State
  readonly activeSlide = signal<number>(0);
  private slideInterval: any;

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }

  startAutoSlide(): void {
    this.stopAutoSlide();
    this.slideInterval = setInterval(() => {
      this.nextSlide();
    }, 6000);
  }

  stopAutoSlide(): void {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }

  setSlide(idx: number): void {
    this.activeSlide.set(idx);
    this.startAutoSlide(); // Reset
  }

  nextSlide(): void {
    this.activeSlide.update(curr => (curr + 1) % 2);
  }

  prevSlide(): void {
    this.activeSlide.update(curr => (curr - 1 + 2) % 2);
  }

  ngOnInit() {
    this.startAutoSlide();
    this.adminApi.getDashboard().subscribe({
      next: (res) => {
        this.data.set(res);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load admin dashboard', err);
        this.isLoading.set(false);
      }
    });
  }
}
