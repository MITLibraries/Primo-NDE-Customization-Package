import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MitAlertBannerComponent } from './mit-alert-banner.component';

describe('MitAlertBannerComponent', () => {
  let langChange: Subject<LangChangeEvent>;
  let mockTranslate: TranslateService;

  beforeEach(async () => {
    langChange = new Subject<LangChangeEvent>();

    await TestBed.configureTestingModule({
      imports: [MitAlertBannerComponent],
      providers: [
        {
          provide: TranslateService,
          useValue: {
            instant: (key: string) => key,
            currentLang: 'en',
            defaultLang: 'en',
            onLangChange: langChange,
            onTranslationChange: of({}),
            onDefaultLangChange: of({}),
          },
        },
      ],
    }).compileComponents();
    mockTranslate = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should display banner when translation has text', () => {
    spyOn(mockTranslate, 'instant').and.returnValue(
      '<p>Alert Banner Content</p>',
    );
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('div'));
    expect(div).toBeTruthy();
    expect(div.nativeElement.innerHTML).toBe('<p>Alert Banner Content</p>');
  });

  it('should hide banner when translation is empty', () => {
    spyOn(mockTranslate, 'instant').and.returnValue('');
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('div'));
    expect(div).toBeFalsy();
  });

  it('should update banner when language changes', () => {
    spyOn(mockTranslate, 'instant').and.returnValue('Initial Banner');
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    fixture.detectChanges();
    (mockTranslate.instant as jasmine.Spy).and.returnValue('Updated Banner');
    langChange.next({ lang: 'fr', translations: {} });
    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('div'));
    expect(div.nativeElement.innerHTML).toBe('Updated Banner');
  });

  it('should hide banner if new language has empty translation', () => {
    spyOn(mockTranslate, 'instant').and.returnValue('Initial Banner');
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    fixture.detectChanges();
    (mockTranslate.instant as jasmine.Spy).and.returnValue('');
    langChange.next({ lang: 'es', translations: {} });

    fixture.detectChanges();
    const div = fixture.debugElement.query(By.css('div'));
    expect(div).toBeFalsy();
  });

  it('should use default label key', () => {
    spyOn(mockTranslate, 'instant').and.returnValue('Default Banner');
    const fixture = TestBed.createComponent(MitAlertBannerComponent);
    fixture.detectChanges();
    expect(mockTranslate.instant).toHaveBeenCalledWith('mit.alertBanner');
    const div = fixture.debugElement.query(By.css('div'));
    expect(div).toBeTruthy();
    expect(div.nativeElement.innerHTML).toBe('Default Banner');
  });
});
