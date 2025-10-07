import { Component, inject, OnInit } from '@angular/core';
import { TacosService } from './tacos.service';
import { AsyncPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';

type SearchState = { searchParams: { q: string } };
export const selectSearchState = createFeatureSelector<SearchState>('Search');
export const selectSearchTerm = createSelector(
  selectSearchState,
  state => state?.searchParams?.q ?? ''
);
@Component({
  selector: 'custom-tacos',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './tacos.component.html',
  styleUrls: ['./tacos.component.scss']
})
export class TacosComponent implements OnInit {

  private tacosService = inject(TacosService)
  private store = inject(Store)

  tacosResponse$!: Observable<any>;

  ngOnInit(): void {
    this.tacosResponse$ = this.store.select(selectSearchTerm).pipe(
      map(q => (q ?? '').trim()),
      filter(q => q.length > 0),
      switchMap(q => this.tacosService.getTacosResponse(q)),
    );


  }


}
