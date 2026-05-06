import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PrimoBrandedNameComponent } from './primo-branded-name.component';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { By } from '@angular/platform-browser';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';

// Initial state for the mock store
const initialState = { viewConfig: { config: { vid: 'TESTVID' } } };

describe('PrimoBrandedNameComponent', () => {
  let component: PrimoBrandedNameComponent;
  let fixture: ComponentFixture<PrimoBrandedNameComponent>;
  let store: MockStore;
  let langChange: Subject<LangChangeEvent>;

  beforeEach(async () => {
    langChange = new Subject<LangChangeEvent>();

    // Configure the testing module for the component
    await TestBed.configureTestingModule({
      imports: [PrimoBrandedNameComponent], // Import the standalone component
      providers: [
        // Provide a mock store with the initial state for testing
        provideMockStore({ initialState }),

        // The component template uses `| translate` and the component class injects
        // TranslateService to read the current language. We provide a minimal mock
        // rather than bootstrapping the full TranslateModule to keep tests fast and
        // free from HTTP or file-system dependencies.
        //
        // - get(key): called by TranslatePipe to resolve translations; returns an
        //   Observable so the pipe can subscribe to it.
        // - currentLang / defaultLang: read synchronously as the initialValue for
        //   the lang signal in the component, seeding the URL before any change fires.
        // - onLangChange: a Subject so tests can emit new LangChangeEvent values and
        //   assert the URL reacts accordingly.
        // - onTranslationChange / onDefaultLangChange: required by TranslatePipe
        //   internally; of({}) satisfies the subscribe call and then completes.
        {
          provide: TranslateService,
          useValue: {
            get: (key: string) => of(key),
            // Called by TranslatePipe.updateValue() after get() resolves to handle
            // interpolation params. Returns the key as-is since we have no real translations.
            getParsedResult: (_translations: any, key: string, _params?: any) =>
              key,
            currentLang: 'en',
            defaultLang: 'en',
            onLangChange: langChange,
            onTranslationChange: of({}),
            onDefaultLangChange: of({}),
          },
        },
      ],
    }).compileComponents();

    // Inject the mock store for use in tests (if needed)
    store = TestBed.inject(MockStore);

    // Create the component fixture and instance
    fixture = TestBed.createComponent(PrimoBrandedNameComponent);
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

  it('should build the URL with the initial language', () => {
    expect(component.url()).toContain('lang=en');
  });

  it('should update the URL when the language changes', () => {
    langChange.next({ lang: 'fr', translations: {} });
    fixture.detectChanges();
    expect(component.url()).toContain('lang=fr');
  });
});
