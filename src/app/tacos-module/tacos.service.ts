import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';



@Injectable({
  providedIn: 'root'
})
export class TacosService {

  constructor() { }
  private httpClient = inject(HttpClient);

  private tacosUrl = 'https://tacos.libraries.mit.edu/graphql';
  private tacosHeaders = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  getTacosResponse(searchTerm?: string): Observable<any> {
    const safeTerm = (searchTerm ?? '').replace(/"/g, '\\"');
    const graphQlQuery = `{logSearchEvent(searchTerm: \"${safeTerm}\", sourceSystem: \"nde-sandbox\") {phrase detectors {suggestedResources {title url}}}}`;
    console.log(graphQlQuery)
    return this.httpClient.post(
      this.tacosUrl,
      { query: graphQlQuery },
      { headers: this.tacosHeaders }
    ).pipe(
      tap(res => console.log('TacosService.getTacosResponse response:', res)),
      catchError(err => {
        console.error('TacosService.getTacosResponse error:', err);
        // rethrow the error so subscribers can handle it
        return throwError(() => err);
      })
    );
  }



}
