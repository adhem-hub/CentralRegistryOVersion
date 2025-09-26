import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyDetailsModalComponent } from './company-details-modal.component';

describe('CompanyDetailsModalComponent', () => {
  let component: CompanyDetailsModalComponent;
  let fixture: ComponentFixture<CompanyDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyDetailsModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyDetailsModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
