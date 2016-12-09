import { autoinject } from 'aurelia-framework';
import { RouteConfig } from 'aurelia-router';
import { FeatureRoutes } from './feature-routes';

export * from './feature-routes';

@autoinject
export class FeatureConfiguration {
  constructor(private featureRoutes: FeatureRoutes) {
  }

  get routes(): RouteConfig[] {
    return this.featureRoutes.routes;
  }

  set routes(routes: RouteConfig[]) {
    this.featureRoutes.map(routes);
  }
}
