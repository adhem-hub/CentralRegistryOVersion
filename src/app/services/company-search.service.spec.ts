import { TestBed } from '@angular/core/testing';

import { CompanySearchService } from './company-search.service';

describe('CompanySearchService', () => {
  let service: CompanySearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompanySearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
