import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

describe('ConfirmDialogComponent', () => {
  let component: ConfirmDialogComponent;
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let dialogService: ConfirmDialogService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
      providers: [ConfirmDialogService]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    dialogService = TestBed.inject(ConfirmDialogService);
    fixture.detectChanges();
  });

  it('should create and remain hidden when no dialog is active', () => {
    expect(component).toBeTruthy();
    const dialogEl = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialogEl).toBeNull();
  });

  it('should render dialog content when dialogService has active dialog', () => {
    dialogService.confirm({
      title: 'تسجيل الخروج',
      body: 'هل أنت متأكد؟',
      confirmLabel: 'تأكيد',
      cancelLabel: 'إلغاء',
      variant: 'danger'
    });
    fixture.detectChanges();

    const dialogEl = fixture.nativeElement.querySelector('[role="alertdialog"]');
    expect(dialogEl).toBeTruthy();
    expect(dialogEl.textContent).toContain('تسجيل الخروج');
    expect(dialogEl.textContent).toContain('هل أنت متأكد؟');
  });

  it('should cancel on escape key', () => {
    let resolvedValue: boolean | null = null;
    dialogService.confirm({
      title: 'تأكيد',
      body: 'نص تجريبي',
      confirmLabel: 'نعم',
      cancelLabel: 'لا'
    }).subscribe(val => resolvedValue = val);

    fixture.detectChanges();

    const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
    component.onEscape(escapeEvent);

    expect(resolvedValue).toBe(false);
    expect(dialogService.currentDialog()).toBeNull();
  });
});
