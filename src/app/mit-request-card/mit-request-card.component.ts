import {
  Component,
  Input,
  ElementRef,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Contract for the host component properties and methods
 * that the MitRequestCard component depends on
 */
interface RequestCard {
  requestService?: {
    iconName: string;
    serviceTitle: string;
    serviceDescription: string;
  };
  isNotGES?(): boolean;
  handleRequestBtnClick?(): void;
  getLinkForGesOrResourceSharing?(): string;
  sendAnalytics?(): void;
}

@Component({
  selector: 'custom-mit-request-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
  ],
  templateUrl: './mit-request-card.component.html',
  styleUrl: './mit-request-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MitRequestCardComponent implements OnInit {
  @Input() private hostComponent!: RequestCard;
  @ViewChild(MatIcon, { read: ElementRef, static: true })
  private hostIcon!: ElementRef<HTMLElement>;

  constructor(private elementRef: ElementRef) {}

  get host() {
    return this.hostComponent;
  }

  // Getter for serviceDescription so we can handle cases where service description might
  // contain HTML content and we want to bind it safely in the template.
  get serviceDescription(): string {
    const desc = this.host?.requestService?.serviceDescription ?? '';
    return desc;
  }

  ngOnInit() {
    this.extractSvgFromHost();
  }

  // The OOTB NDE template for this component uses a custom directive *ndeIcon which is not available to this custom component.
  // As an alternative, we can extract the SVG from the host component's mat-icon and insert it into this component's mat-icon.
  private extractSvgFromHost() {
    // Get the icon name from the host's requestService property.
    const iconName = this.host?.requestService?.iconName;
    if (!iconName) {
      console.error('Icon name not available from host');
      return;
    }

    // Get this component's native element to use as a reference for finding the host component
    const customComponent = this.elementRef.nativeElement;

    // Find the host component (previous sibling or ancestor) where we'll get the icon SVG from.
    // This assumes that the host component is the previous sibling of this custom component in the DOM.
    // which is how this is mapped in customComponentMappings.ts i.e. 'nde-request-card-after'
    let hostElement = customComponent.parentElement?.previousElementSibling;

    if (!hostElement) {
      console.error('Host element not found');
      return;
    }

    // Find the host's rendered mat-icon with the matching icon name
    const hostSvg = hostElement.querySelector(
      `mat-icon[data-mat-icon-name="${iconName}"] svg`,
    );

    if (!hostSvg) {
      console.error(
        'could not retrieve svg from host matching icon name:',
        iconName,
      );
      return;
    }

    // Clone and insert the SVG into the placeholder
    const svgClone = hostSvg.cloneNode(true) as Node;
    this.hostIcon.nativeElement.appendChild(svgClone);
  }
  // use the host component's methods to handle the click event
  handleCardClick(): void {
    if (this.host?.isNotGES?.()) {
      this.host.handleRequestBtnClick?.();
    } else {
      const link = this.host?.getLinkForGesOrResourceSharing?.();
      // send analytics event for GES or Resource Sharing click
      // the request form handles sending analytics for non-GES requests.
      this.host?.sendAnalytics?.();
      if (link) {
        window.open(link, '_blank', 'noopener,noreferrer');
      }
    }
  }
}
