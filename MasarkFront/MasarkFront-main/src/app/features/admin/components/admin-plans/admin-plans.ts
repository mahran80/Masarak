import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { AdminApiService } from '../../../../core/services/admin-api-service';

export interface PlanDto {
  planId: number;
  name: string;
  description: string;
  type: number;
  price: number;
  currency: string;
  durationDays: number;
  maxSubjects: number;
  hasAi: boolean;
  hasLiveClass: boolean;
}

@Component({
  selector: 'app-admin-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DecimalPipe],
  templateUrl: './admin-plans.html'
})
export class AdminPlansComponent implements OnInit {
  private readonly adminApi = inject(AdminApiService);

  plans = signal<PlanDto[]>([]);
  isLoading = signal(false);

  showModal = signal(false);
  editingPlan = signal<PlanDto | null>(null);

  formData = {
    name: '',
    description: '',
    type: 0,
    price: 0,
    currency: 'EGP',
    durationDays: 30,
    maxSubjects: 0,
    hasAi: false,
    hasLiveClass: false
  };

  ngOnInit() {
    this.loadPlans();
  }

  loadPlans() {
    this.isLoading.set(true);
    // Use an existing public API or create admin wrapper. We'll assume adminApi has a getPlans if we added it,
    // or we can just fetch from `/api/plans`. Wait, I'll add `getPlans()` to AdminApiService in a moment.
    this.adminApi.getPlans().subscribe({
      next: (data: PlanDto[]) => {
        this.plans.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openCreateModal() {
    this.editingPlan.set(null);
    this.formData = {
      name: '',
      description: '',
      type: 0,
      price: 0,
      currency: 'EGP',
      durationDays: 30,
      maxSubjects: 1,
      hasAi: false,
      hasLiveClass: false
    };
    this.showModal.set(true);
  }

  openEditModal(plan: PlanDto) {
    this.editingPlan.set(plan);
    this.formData = { ...plan, type: plan.type || 0 };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  savePlan() {
    const isEdit = this.editingPlan() !== null;
    if (isEdit) {
      this.adminApi.updatePlan(this.editingPlan()!.planId, this.formData).subscribe(() => {
        this.loadPlans();
        this.closeModal();
      });
    } else {
      this.adminApi.createPlan(this.formData).subscribe(() => {
        this.loadPlans();
        this.closeModal();
      });
    }
  }

  deletePlan(planId: number) {
    if (confirm('هل أنت متأكد من حذف هذه الخطة؟')) {
      this.adminApi.deletePlan(planId).subscribe(() => {
        this.loadPlans();
      });
    }
  }
}
