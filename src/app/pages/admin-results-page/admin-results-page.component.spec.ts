import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminResultsPageComponent } from './admin-results-page.component';

describe('AdminResultsPageComponent', () => {
  let component: AdminResultsPageComponent;
  let fixture: ComponentFixture<AdminResultsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResultsPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminResultsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
