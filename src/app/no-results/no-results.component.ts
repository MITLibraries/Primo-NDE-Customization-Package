import { Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';
import { createFeatureSelector, createSelector } from '@ngrx/store';

type SearchState = { searchParams: { q: string } };

export const selectSearchState = createFeatureSelector<SearchState>('Search');
export const selectSearchTerm = createSelector(
  selectSearchState,
  (state) => state?.searchParams?.q ?? '',
);

@Component({
  selector: 'custom-no-results',
  standalone: true,
  imports: [],
  templateUrl: './no-results.component.html',
  styleUrl: './no-results.component.scss',
})
export class NoResultsComponent {
  private store = inject(Store);

  searchTerm = toSignal(this.store.select(selectSearchTerm), {
    initialValue: '',
  });

  worldcatUrl = computed(
    () =>
      `https://mit.on.worldcat.org/search?queryString=${encodeURIComponent(this.searchTerm())}`,
  );
}
