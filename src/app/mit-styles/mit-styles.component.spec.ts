import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MitStylesComponent } from './mit-styles.component';

describe('MitStylesComponent', () => {
  let component: MitStylesComponent;
  let fixture: ComponentFixture<MitStylesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MitStylesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MitStylesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
