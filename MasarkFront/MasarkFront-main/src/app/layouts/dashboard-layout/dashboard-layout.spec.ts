import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardLayoutComponent } from './dashboard-layout';
import { AuthStateService } from '../../core/services/auth-state-service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { of } from 'rxjs';

describe('DashboardLayoutComponent', () => {
  let component: DashboardLayoutComponent;
  let fixture: ComponentFixture<DashboardLayoutComponent>;
  let authStateService: AuthStateService;
  let confirmDialogService: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLayoutComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardLayoutComponent);
    component = fixture.componentInstance;
    authStateService = TestBed.inject(AuthStateService);
    confirmDialogService = TestBed.inject(ConfirmDialogService);
    await fixture.whenStable();
  });

  it('should create the dashboard layout component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with expanded sidebar by default', () => {
    expect(component.sidebarExpanded()).toBe(true);
  });

  it('should toggle sidebar state', () => {
    const initial = component.sidebarExpanded();
    component.toggleSidebar();
    expect(component.sidebarExpanded()).toBe(!initial);
  });

  it('should toggle and close mobile drawer', () => {
    expect(component.mobileDrawerOpen()).toBe(false);
    component.toggleMobileDrawer();
    expect(component.mobileDrawerOpen()).toBe(true);
    component.closeMobileDrawer();
    expect(component.mobileDrawerOpen()).toBe(false);
  });

  it('should close menus and mobile drawer on escape key', () => {
    component.mobileDrawerOpen.set(true);
    component.isUserMenuOpen.set(true);
    component.onEscapeKey();
    expect(component.mobileDrawerOpen()).toBe(false);
    expect(component.isUserMenuOpen()).toBe(false);
  });

  it('should provide student navigation items when role is Student', () => {
    authStateService.setAuth({
      accessToken: 'token',
      refreshToken: 'refresh',
      user: {
        userId: 1,
        fullName: 'طالب مسارك',
        email: 'student@masarak.com',
        role: 'Student',
        phone: null,
        country: null,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    });

    const groups = component.navGroups();
    expect(groups.length).toBeGreaterThan(0);
    const learningGroup = groups.find(g => g.heading === 'التعلم');
    expect(learningGroup).toBeTruthy();
    expect(learningGroup?.items.some(i => i.label === 'دروسي')).toBe(true);
    expect(learningGroup?.items.some(i => i.label === 'الاختبارات')).toBe(true);
  });

  it('should open confirmation dialog on logout', () => {
    const confirmSpy = vi.spyOn(confirmDialogService, 'confirm').mockReturnValue(of(false));
    component.logout();
    expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
      title: 'تسجيل الخروج',
      variant: 'danger'
    }));
  });
});
