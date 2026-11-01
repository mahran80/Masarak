import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { BreadcrumbComponent } from './breadcrumb.component';
import { Component } from '@angular/core';

@Component({
  standalone: true,
  template: `<div>Mock Page</div>`
})
class MockPageComponent {}

describe('BreadcrumbComponent', () => {
  let component: BreadcrumbComponent;
  let fixture: ComponentFixture<BreadcrumbComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        provideRouter([
          {
            path: 'dashboard',
            data: { breadcrumb: 'الرئيسية' },
            component: MockPageComponent,
            children: [
              {
                path: 'exams',
                data: { breadcrumb: 'الاختبارات' },
                component: MockPageComponent
              }
            ]
          }
        ])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    await fixture.whenStable();
  });

  it('should create the breadcrumb component', () => {
    expect(component).toBeTruthy();
  });

  it('should use explicit items input when provided for backward compatibility', async () => {
    component.items = [
      { label: 'الرئيسية', route: '/dashboard' },
      { label: 'تفاصيل الاختبار' }
    ];
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeCrumbs().length).toBe(2);
    expect(component.activeCrumbs()[0].label).toBe('الرئيسية');
    expect(component.activeCrumbs()[1].label).toBe('تفاصيل الاختبار');

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('الرئيسية');
    expect(compiled.textContent).toContain('تفاصيل الاختبار');
  });

  it('should resolve breadcrumbs from route hierarchy when navigating', async () => {
    await router.navigateByUrl('/dashboard/exams');
    fixture.detectChanges();
    await fixture.whenStable();

    const crumbs = component.activeCrumbs();
    expect(crumbs.length).toBe(2);
    expect(crumbs[0].label).toBe('الرئيسية');
    expect(crumbs[1].label).toBe('الاختبارات');

    const compiled = fixture.nativeElement as HTMLElement;
    const nav = compiled.querySelector('nav[aria-label="مسار التنقل"]');
    expect(nav).toBeTruthy();
    const current = compiled.querySelector('[aria-current="page"]');
    expect(current).toBeTruthy();
    expect(current?.textContent).toContain('الاختبارات');
  });
});
