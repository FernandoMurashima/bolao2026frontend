import { TestBed } from '@angular/core/testing';

import { CopaService } from './copa.service';

describe('CopaService', () => {
  let service: CopaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CopaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
