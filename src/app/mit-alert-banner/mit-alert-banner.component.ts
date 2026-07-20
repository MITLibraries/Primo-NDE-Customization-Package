import { Component, inject, input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';

@Component({
  selector: 'custom-mit-alert-banner',
  standalone: true,
  templateUrl: './mit-alert-banner.component.html',
  styleUrl: './mit-alert-banner.component.scss',
})
export class MitAlertBannerComponent {
  private translate = inject(TranslateService);

  // Can be overridden by passing a different key via template binding
  // Default: 'mit.alertBanner' - hide banner by setting to NOT_DEFINED in Alma
  labelKey = input('mit.alertBanner');

  // Compute banner text and only show if it has content
  bannerText = toSignal(
    this.translate.onLangChange.pipe(
      startWith(null),
      map(() => this.translate.instant(this.labelKey()).trim()),
    ),
    { initialValue: '' },
  );
}
