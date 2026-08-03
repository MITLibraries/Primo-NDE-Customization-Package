import { Component, inject, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { createFeatureSelector, createSelector } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AssetsPublicPathDirective } from '../services/assets-public-path.directive';
import { map } from 'rxjs';

// State shape for the View feature in the store
type ViewConfigState = { config: { vid: string } };

// Selector to get the viewConfig feature state from the store
export const selectViewConfigState =
  createFeatureSelector<ViewConfigState>('viewConfig');

// Selector to extract just the vid parameter from the viewConfig state
export const selectVid = createSelector(
  selectViewConfigState,
  (state) => state?.config?.vid ?? '',
);

@Component({
  selector: 'custom-primo-branded-name',
  standalone: true,
  host: { class: 'nde-primo-branded-name' },
  imports: [TranslateModule, AssetsPublicPathDirective],
  templateUrl: './primo-branded-name.component.html',
  styleUrl: './primo-branded-name.component.scss',
})
export class PrimoBrandedNameComponent {
  private store = inject(Store);
  private translate = inject(TranslateService);

  vid = toSignal(this.store.select(selectVid), { initialValue: '' });

  // onLangChange only fires on future language changes, not the current language,
  // so we seed initialValue from currentLang → defaultLang → 'en' as a fallback.
  lang = toSignal(this.translate.onLangChange.pipe(map((e) => e.lang)), {
    initialValue:
      this.translate.currentLang || this.translate.defaultLang || 'en',
  });

  url = computed(() => `home?vid=${this.vid()}&lang=${this.lang()}`);
}
