import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegulationPageComponent } from './regulation-page.component';

describe('RegulationPageComponent', () => {
  let component: RegulationPageComponent;
  let fixture: ComponentFixture<RegulationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegulationPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RegulationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
