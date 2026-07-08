import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';

import { MitRequestCardComponent } from './mit-request-card.component';

describe('MitRequestCardComponent', () => {
  let component: MitRequestCardComponent;
  let fixture: ComponentFixture<MitRequestCardComponent>;

  // TranslateModule is required because the template uses the translate pipe.
  // fixture.detectChanges() is omitted from the outer beforeEach so each
  // describe block controls when ngOnInit fires: handleCardClick tests call
  // methods directly, extractSvgFromHost tests call detectChanges() themselves.
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MitRequestCardComponent, TranslateModule.forRoot()],
    }).compileComponents();

    fixture = TestBed.createComponent(MitRequestCardComponent);
    component = fixture.componentInstance;
    // Provide a minimal hostComponent so the component does not throw
    // if anything accesses host properties before a test sets its own mock.
    (component as any).hostComponent = {
      requestService: {
        iconName: 'test-icon',
        serviceTitle: 'Test Service',
        serviceDescription: 'Test Description',
      },
    };
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // handleCardClick delegates to host component methods depending on whether
  // the request is a GES (General Electronic Service) request or not.
  describe('handleCardClick', () => {
    let mockHost: jasmine.SpyObj<{
      isNotGES(): boolean;
      handleRequestBtnClick(): void;
      getLinkForGesOrResourceSharing(): string;
      sendAnalytics(): void;
    }>;

    // A spy object gives us all four host methods as trackable spies.
    // getLinkForGesOrResourceSharing defaults to a valid URL; GES tests spy on
    // window.open in their own beforeEach to prevent real tabs from opening.
    beforeEach(() => {
      mockHost = jasmine.createSpyObj('mockHost', [
        'isNotGES',
        'handleRequestBtnClick',
        'getLinkForGesOrResourceSharing',
        'sendAnalytics',
      ]);
      mockHost.getLinkForGesOrResourceSharing.and.returnValue(
        'http://example.com',
      );
      (component as any).hostComponent = mockHost;
    });

    // Non-GES requests (Physical item requests) are handled by the host
    // component's own handleRequestBtnClick method.
    describe('when isNotGES returns true (non-GES request)', () => {
      beforeEach(() => mockHost.isNotGES.and.returnValue(true));

      it('should call handleRequestBtnClick', () => {
        component.handleCardClick();
        expect(mockHost.handleRequestBtnClick).toHaveBeenCalled();
      });

      it('should not call getLinkForGesOrResourceSharing', () => {
        component.handleCardClick();
        expect(mockHost.getLinkForGesOrResourceSharing).not.toHaveBeenCalled();
      });

      it('should not call sendAnalytics', () => {
        component.handleCardClick();
        expect(mockHost.sendAnalytics).not.toHaveBeenCalled();
      });
    });

    // GES (General Electronic Service) requests get a link and fire an analytics event.
    describe('when isNotGES returns false (GES request)', () => {
      beforeEach(() => {
        mockHost.isNotGES.and.returnValue(false);
        // Prevent real browser tabs opening — the default mock returns a valid
        // URL which would otherwise trigger window.open on every test here.
        spyOn(window, 'open');
      });

      it('should call getLinkForGesOrResourceSharing', () => {
        component.handleCardClick();
        expect(mockHost.getLinkForGesOrResourceSharing).toHaveBeenCalled();
      });

      it('should call sendAnalytics', () => {
        component.handleCardClick();
        expect(mockHost.sendAnalytics).toHaveBeenCalled();
      });

      it('should not call handleRequestBtnClick', () => {
        component.handleCardClick();
        expect(mockHost.handleRequestBtnClick).not.toHaveBeenCalled();
      });
    });

    it('should not throw when host is undefined', () => {
      // The component uses optional chaining throughout handleCardClick,
      // so a missing hostComponent should degrade gracefully rather than throw.
      (component as any).hostComponent = undefined;
      expect(() => component.handleCardClick()).not.toThrow();
    });
  });

  // extractSvgFromHost runs during ngOnInit and clones the SVG from the NDE
  // host component's mat-icon into this component's own placeholder span.
  // Tests drive it through fixture.detectChanges() so the real @ViewChild
  // reference is used and the outcome is verified in the rendered DOM.
  describe('extractSvgFromHost', () => {
    let mockHostElement: HTMLDivElement;

    beforeEach(() => {
      // Insert mockHostElement immediately before the fixture's parent container
      // so the component's DOM traversal (parentElement.previousElementSibling)
      // resolves to our mock NDE host element when ngOnInit fires.
      mockHostElement = document.createElement('div');
      const container = fixture.nativeElement.parentElement;
      container.parentElement!.insertBefore(mockHostElement, container);

      // Simulate the NDE host's rendered mat-icon with an SVG inside.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      const hostMatIcon = document.createElement('mat-icon');
      hostMatIcon.setAttribute('data-mat-icon-name', 'test-icon');
      hostMatIcon.appendChild(svg);
      mockHostElement.appendChild(hostMatIcon);
    });

    afterEach(() => {
      mockHostElement.remove();
    });

    it('should clone the host SVG into the mat-icon placeholder on init', () => {
      fixture.detectChanges(); // triggers ngOnInit → extractSvgFromHost

      const clonedSvg = fixture.nativeElement.querySelector('mat-icon svg');
      expect(clonedSvg).toBeTruthy();
      expect(clonedSvg.getAttribute('viewBox')).toBe('0 0 24 24');
    });

    it('should not remove the original SVG from the host on init', () => {
      // Verifies cloneNode is used rather than moving the node.
      const originalSvg = mockHostElement.querySelector('svg')!;
      fixture.detectChanges();
      expect(mockHostElement.querySelector('svg')).toBe(originalSvg);
    });
  });
});
