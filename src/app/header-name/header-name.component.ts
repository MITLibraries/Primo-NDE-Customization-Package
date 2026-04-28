import { Component, inject, computed } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { createFeatureSelector, createSelector } from '@ngrx/store';

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
  selector: 'custom-header-name',
  standalone: true,
  imports: [],
  templateUrl: './header-name.component.html',
  styleUrl: './header-name.component.scss',
})
export class HeaderNameComponent {
  private store = inject(Store);
  vid = toSignal(this.store.select(selectVid), { initialValue: '' });
  url = computed(() => `home?vid=${this.vid()}&lang=en`);
}
