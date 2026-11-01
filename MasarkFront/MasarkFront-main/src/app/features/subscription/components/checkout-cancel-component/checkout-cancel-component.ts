import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-checkout-cancel',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div class="card p-10 max-w-md w-full text-center">
        <div class="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-6">
          <svg class="w-10 h-10 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-slate-900 mb-2">تم إلغاء عملية الدفع</h1>
        <p class="text-slate-500 mb-8">
          لم يتم خصم أي مبالغ. يمكنك العودة لصفحة الخطط والاشتراك في أي وقت.
        </p>
        <a routerLink="/dashboard/plans" class="btn-primary w-full block text-center">
          عرض الخطط المتاحة
        </a>
        <a routerLink="/dashboard" class="block text-center text-sm font-semibold text-slate-600 hover:text-blue-600 mt-4 transition-colors">
          العودة للوحة التحكم
        </a>
      </div>
    </div>
  `,
})
export class CheckoutCancelComponent {}