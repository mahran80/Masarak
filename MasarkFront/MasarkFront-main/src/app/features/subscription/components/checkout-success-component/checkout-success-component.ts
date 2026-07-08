import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthStateService } from '../../../../core/services/auth-state-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-success',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
    <div class="min-h-screen bg-surface-50 flex items-center justify-center px-4">
      <div class="card p-10 max-w-md w-full text-center">
        <div class="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
             [ngClass]="isVerifying ? 'bg-blue-100 text-blue-600' : (verificationSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')">
          @if (isVerifying) {
            <svg class="w-10 h-10 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          } @else if (verificationSuccess) {
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
          } @else {
            <svg class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          }
        </div>
        <h1 class="text-2xl font-bold text-surface-900 font-display mb-2">
          {{ isVerifying ? 'جاري تأكيد الدفع...' : (verificationSuccess ? 'تم الدفع بنجاح!' : 'فشل التأكيد') }}
        </h1>
        <p class="text-surface-500 mb-8">
          {{ isVerifying ? 'يرجى الانتظار بينما نقوم بتأكيد اشتراكك مع البنك...' : 
             (verificationSuccess ? 'تم تفعيل اشتراكك بنجاح. سيتم توجيهك تلقائياً...' : 
             'حدثت مشكلة أثناء تأكيد الدفع أو تم الدفع مسبقاً.') }}
        </p>
        
        @if (!isVerifying) {
          <button (click)="goBack()" class="btn-primary w-full btn-lg">
            العودة للوحة التحكم
          </button>
        }
      </div>
    </div>
  `,
})
export class CheckoutSuccessComponent implements OnInit {
  isVerifying = true;
  verificationSuccess = false;
  
  private auth = inject(AuthStateService);
  private router = inject(Router);

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const sessionId = params['session_id'];
      if (sessionId) {
        // Use the appropriate verify endpoint based on role
        const endpoint = this.auth.userRole() === 'Parent' 
          ? `${environment.apiUrl}/parent/subscribe/verify?sessionId=${sessionId}`
          : `${environment.apiUrl}/subscriptions/verify?sessionId=${sessionId}`; // Assumes backend has this, if not, backend needs it

        this.http.post(endpoint, {}).subscribe({
          next: () => {
            this.isVerifying = false;
            this.verificationSuccess = true;
            // Auto redirect after 3 seconds
            setTimeout(() => this.goBack(), 3000);
          },
          error: (err) => {
            console.error('Verification failed', err);
            this.isVerifying = false;
            this.verificationSuccess = false;
          }
        });
      } else {
        this.isVerifying = false;
        this.verificationSuccess = false;
      }
    });
  }

  goBack() {
    if (this.auth.userRole() === 'Parent') {
      this.router.navigate(['/dashboard/parent/subscriptions']);
    } else {
      this.router.navigate(['/my-subscription']);
    }
  }
}