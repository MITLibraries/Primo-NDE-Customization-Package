import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderNameComponent } from './header-name.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';

// Initial state for the mock store
const initialState = { viewConfig: { config: { vid: 'TESTVID' } } };

describe('HeaderNameComponent', () => {
  let component: HeaderNameComponent;
  let fixture: ComponentFixture<HeaderNameComponent>;
  let store: MockStore;

  beforeEach(async () => {
    // Configure the testing module for the component
    await TestBed.configureTestingModule({
      imports: [HeaderNameComponent], // Import the standalone component
      providers: [
        // Provide a mock store with the initial state for testing
        provideMockStore({ initialState }),
      ],
    }).compileComponents();

    // Inject the mock store for use in tests (if needed)
    store = TestBed.inject(MockStore);

    // Create the component fixture and instance
    fixture = TestBed.createComponent(HeaderNameComponent);
    component = fixture.componentInstance;

    // Trigger initial data binding and change detection
    fixture.detectChanges();
  });

  it('should build the correct URL with vid from store', () => {
    expect(component.url()).toContain('vid=TESTVID');
  });

  it('should render the <a> tag with the correct href', () => {
    const a = fixture.debugElement.query(By.css('a')).nativeElement;
    expect(a.getAttribute('href')).toContain('vid=TESTVID');
  });
});
