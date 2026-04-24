import { HeaderNameComponent } from '../header-name/header-name.component';
import { NoResultsComponent } from '../no-results/no-results.component';

// Define the map
export const selectorComponentMap = new Map<string, any>([
  ['nde-search-no-results', NoResultsComponent],
  ['nde-logo-after', HeaderNameComponent],
]);
