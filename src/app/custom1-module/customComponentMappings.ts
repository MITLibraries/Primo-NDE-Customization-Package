import { PrimoBrandedNameComponent } from '../primo-branded-name/primo-branded-name.component';
import { NoResultsComponent } from '../no-results/no-results.component';
import { MitRequestCardComponent } from '../mit-request-card/mit-request-card.component';
import { MitAlertBannerComponent } from '../mit-alert-banner/mit-alert-banner.component';

// Define the map
export const selectorComponentMap = new Map<string, any>([
  ['nde-search-no-results', NoResultsComponent],
  ['nde-logo-after', PrimoBrandedNameComponent],
  ['nde-request-card-after', MitRequestCardComponent],
  ['nde-header-before', MitAlertBannerComponent],
]);
