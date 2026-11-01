import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogService } from './confirm-dialog.service';

describe('ConfirmDialogService', () => {
  let service: ConfirmDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfirmDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should emit true when resolved with true', async () => {
    const confirmPromise = firstValueFrom(service.confirm({
      title: 'تأكيد',
      body: 'هل أنت متأكد؟',
      confirmLabel: 'نعم',
      cancelLabel: 'لا'
    }));

    expect(service.currentDialog()).toBeTruthy();
    service.resolve(true);

    const result = await confirmPromise;
    expect(result).toBe(true);
    expect(service.currentDialog()).toBeNull();
  });

  it('should emit false when resolved with false', async () => {
    const confirmPromise = firstValueFrom(service.confirm({
      title: 'تأكيد',
      body: 'هل أنت متأكد؟',
      confirmLabel: 'نعم',
      cancelLabel: 'لا'
    }));

    expect(service.currentDialog()).toBeTruthy();
    service.resolve(false);

    const result = await confirmPromise;
    expect(result).toBe(false);
    expect(service.currentDialog()).toBeNull();
  });
});
