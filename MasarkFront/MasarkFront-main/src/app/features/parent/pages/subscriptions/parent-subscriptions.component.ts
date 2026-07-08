import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { Component, inject, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParentService } from '../../services/parent.service';
import { PlansComponent } from '../../../subscription/components/plans-component/plans-component';
import { PlanDto } from '../../../../core/models/subscription.model';
import { environment } from '../../../../../environments/environment';
import { SubscriptionApiService } from '../../../../core/services/subscription-api-service';

@Component({
  selector: 'app-parent-subscriptions',
  standalone: true,
  imports: [IconComponent, CommonModule, FormsModule, PlansComponent],
  templateUrl: './parent-subscriptions.component.html'
})
export class ParentSubscriptionsComponent {
  readonly parentService = inject(ParentService);
  private cdr = inject(ChangeDetectorRef);

  activeSubscription = signal<any>(null);
  loadingSubscription = signal(false);
  isChangingPlan = signal(false);
  processingPlanId = signal<number | null>(null);
  errorMsg = signal<string | null>(null);
  successMsg = signal<string | null>(null);

  constructor() {
    effect(() => {
      const studentId = this.parentService.selectedStudentId();
      if (studentId) {
        this.fetchActiveSubscription(studentId);
      } else {
        this.activeSubscription.set(null);
      }
    });
  }

  ngOnInit() {
    if (this.parentService.linkedStudents().length === 0) {
      this.parentService.fetchLinkedStudents().subscribe();
    }
  }

  fetchActiveSubscription(studentId: number) {
    this.loadingSubscription.set(true);
    this.errorMsg.set(null);
    this.isChangingPlan.set(false);

    this.parentService.getChildSubscription(studentId).subscribe({
      next: (res) => {
        this.activeSubscription.set(res.activeSubscription);
        this.loadingSubscription.set(false);
        this.cdr.detectChanges();
      },
      error: () => {
        this.activeSubscription.set(null);
        this.loadingSubscription.set(false);
        this.cdr.detectChanges();
      }
    });
  }

  startChangePlan() {
    this.isChangingPlan.set(true);
  }

  cancelChangePlan() {
    this.isChangingPlan.set(false);
  }

  onPlanSelected(plan: PlanDto) {
    const studentId = this.parentService.selectedStudentId();
    if (!studentId) return;

    this.errorMsg.set(null);
    this.successMsg.set(null);
    this.processingPlanId.set(plan.planId);

    // If the student doesn't have an active sub, it's a new checkout
    if (!this.activeSubscription()) {
      this.parentService.subscribeForChild(
        studentId, 
        plan.planId,
        environment.stripeSuccessUrl,
        environment.stripeCancelUrl
      ).subscribe({
        next: (res) => {
          window.location.href = res.checkoutUrl;
        },
        error: (err) => {
          this.processingPlanId.set(null);
          this.errorMsg.set(err.error?.message || 'Failed to initiate checkout.');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    // Otherwise, it's a plan change (upgrade/downgrade)
    this.parentService.changeChildSubscription(studentId, plan.planId).subscribe({
      next: (res) => {
        this.processingPlanId.set(null);
        if (res.checkoutUrl) {
          // Stripe requires payment confirmation for massive upgrades
          window.location.href = res.checkoutUrl;
        } else {
          // Instant upgrade or deferred downgrade
          this.successMsg.set('Subscription changed successfully.');
          this.fetchActiveSubscription(studentId);
        }
      },
      error: (err) => {
        this.processingPlanId.set(null);
        this.errorMsg.set(err.error?.message || 'Failed to change subscription.');
        this.cdr.detectChanges();
      }
    });
  }

  onStudentChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (value) {
      this.parentService.setSelectedStudent(Number(value));
    }
  }
}
