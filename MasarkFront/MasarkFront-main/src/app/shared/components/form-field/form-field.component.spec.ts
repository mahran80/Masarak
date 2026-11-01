import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let component: FormFieldComponent;
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    component = fixture.componentInstance;
    component.label = 'الاسم';
    component.fieldId = 'name-field';
    fixture.detectChanges();
  });

  it('should create and render label', () => {
    expect(component).toBeTruthy();
    const labelEl = fixture.nativeElement.querySelector('label');
    expect(labelEl).toBeTruthy();
    expect(labelEl.getAttribute('for')).toBe('name-field');
    expect(labelEl.textContent).toContain('الاسم');
  });

  it('should render required asterisk when required is true', () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();
    const star = fixture.nativeElement.querySelector('span.text-red-500');
    expect(star).toBeTruthy();
    expect(star.textContent).toContain('*');
  });

  it('should render alert error message when errorMessage is provided', () => {
    fixture.componentRef.setInput('errorMessage', 'حقل مطلوب');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('small[role="alert"]');
    expect(errorEl).toBeTruthy();
    expect(errorEl.id).toBe('name-field-error');
    expect(errorEl.textContent).toContain('حقل مطلوب');
  });
});
