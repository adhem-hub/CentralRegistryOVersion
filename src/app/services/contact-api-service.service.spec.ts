import { TestBed } from '@angular/core/testing';

import { ContactApiService } from './contact-api-service.service';

describe('ContactApiServiceService', () => {
  let service: ContactApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
