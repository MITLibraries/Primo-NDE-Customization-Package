import { TestBed } from '@angular/core/testing';

import { TacosService } from './tacos.service';

describe('TacosService', () => {
  let service: TacosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TacosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
