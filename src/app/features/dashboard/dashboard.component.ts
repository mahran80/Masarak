import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthStateService } from '../../core/auth-state.service';
import { SubscriptionApiService } from '../../services/subscription.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { SubscriptionStatusResponse } from '../../models/subscription.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent],
  template: `
    <div class="page-container">
      <!-- Greeting -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-surface-900 font-display">
          Hello, {{ firstName() }} 👋
        </h1>
        <p class="text-surface-500 mt-1">Here's what's happening with your account.</p>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">

        <!-- Subscription status card -->
        <div class="card p-6 col-span-1 sm:col-span-2 lg:col-span-1">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-medium text-surface-500">Subscription</p>
            <div class="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
          </div>

          <app-loading-spinner *ngIf="subLoading()" size="sm"></app-loading-spinner>

          <ng-container *ngIf="!subLoading()">
            <ng-container *ngIf="subStatus()?.hasActiveSubscription">
              <p class="text-2xl font-bold text-surface-900 font-display">
                {{ subStatus()!.activeSubscription!.planName }}
              </p>
              <div class="flex items-center gap-2 mt-2">
                <span class="badge-active">Active</span>
                <span class="text-xs text-surface-500">
                  until {{ subStatus()!.activeSubscription!.endDate | date:'mediumDate' }}
                </span>
              </div>
            </ng-container>
            <ng-container *ngIf="!subStatus()?.hasActiveSubscription">
              <p class="text-xl font-semibold text-surface-900">No active plan</p>
              <a routerLink="/plans" class="inline-flex items-center gap-1 text-sm text-brand-600
                 hover:text-brand-700 font-medium mt-2">
                View Plans →
              </a>
            </ng-container>
          </ng-container>
        </div>

        <!-- Role card -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-medium text-surface-500">Account Type</p>
            <div class="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg class="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
            </div>
          </div>
          <p class="text-2xl font-bold text-surface-900 font-display">{{ auth.user()?.role }}</p>
          <p class="text-xs text-surface-500 mt-2 truncate">{{ auth.user()?.email }}</p>
        </div>

        <!-- Quick action card -->
        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <p class="text-sm font-medium text-surface-500">Quick Actions</p>
          </div>
          <div class="space-y-2">
            <a routerLink="/my-subscription"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              My Subscription
            </a>
            <a *ngIf="auth.isParent()" routerLink="/parent/linked-students"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              My Students
            </a>
            <a *ngIf="auth.isAdmin()" routerLink="/admin/subscriptions"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <!-- Admin Phase 1 -->
              Admin Panel
            </a>
            
            <!-- Phase 2: Admin Academic Links -->
            <a *ngIf="auth.isAdmin()" routerLink="/admin/grades"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors pl-8">
              📝 Grade Management
            </a>
            <a *ngIf="auth.isAdmin()" routerLink="/admin/subjects"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors pl-8">
              📚 Subject Management
            </a>
            <a *ngIf="auth.isAdmin()" routerLink="/admin/classes"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors pl-8">
              🏫 Class Management
            </a>
            <a *ngIf="auth.isAdmin()" routerLink="/admin/assignments"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors pl-8">
              👩‍🏫 Teaching Assignments
            </a>
            <a *ngIf="auth.isAdmin()" routerLink="/admin/enrollments"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors pl-8">
              👥 Student Enrollments
            </a>

            <!-- Phase 2: Teacher Links -->
            <a *ngIf="auth.isTeacher()" routerLink="/teacher/assignments"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              My Teaching Assignments
            </a>
            <a *ngIf="auth.isTeacher()" routerLink="/teacher/sessions"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              My Sessions
            </a>
            <a *ngIf="auth.isTeacher()" routerLink="/teacher/assessment/assignments"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              📝 Manage Assignments
            </a>
            <a *ngIf="auth.isTeacher()" routerLink="/teacher/assessment/exams"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              🏆 Manage Exams
            </a>

            <!-- Phase 2: Student Links -->
            <a *ngIf="auth.isStudent()" routerLink="/student/my-class"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
              </svg>
              My Class
            </a>
            <a *ngIf="auth.isStudent()" routerLink="/student/schedule"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              My Schedule
            </a>
            <a *ngIf="auth.isStudent()" routerLink="/student/assessment/assignments"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              📝 My Assignments
            </a>
            <a *ngIf="auth.isStudent()" routerLink="/student/assessment/exams"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              🏆 My Exams
            </a>
            <a routerLink="/plans"
               class="flex items-center gap-2 text-sm text-surface-700 hover:text-brand-600
                      hover:bg-brand-50 px-3 py-2 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 10V5a2 2 0 012-2z"/>
              </svg>
              View Plans
            </a>
          </div>
        </div>
      </div>

      <!-- Welcome banner for new users -->
      <div *ngIf="!subLoading() && !subStatus()?.hasActiveSubscription && !auth.isAdmin()"
           class="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 p-8 text-white">
        <h2 class="text-2xl font-bold font-display mb-2">Get started with Masarak</h2>
        <p class="text-brand-200 mb-6 max-w-lg">
          Subscribe to a plan to unlock courses, live classes, AI-powered recommendations, and more.
        </p>
        <a routerLink="/plans" class="btn bg-white text-brand-700 hover:bg-brand-50 btn-lg">
          Explore Plans →
        </a>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  readonly auth   = inject(AuthStateService);
  private subApi  = inject(SubscriptionApiService);

  subStatus  = signal<SubscriptionStatusResponse | null>(null);
  subLoading = signal(true);
  firstName = computed(() => this.auth.user()?.fullName?.split(' ')[0] ?? 'there');

  ngOnInit(): void {
    if (!this.auth.isAdmin()) {
      this.subApi.getMySubscriptionStatus().subscribe({
        next:  s  => { this.subStatus.set(s); this.subLoading.set(false); },
        error: () => this.subLoading.set(false),
      });
    } else {
      this.subLoading.set(false);
    }
  }
}
