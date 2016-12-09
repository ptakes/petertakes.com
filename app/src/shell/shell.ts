import { autoinject } from 'aurelia-framework';
import { ConfiguresRouter, RouteConfig, Router, RouterConfiguration } from 'aurelia-router';
import { FeatureRoutes } from '../feature';

@autoinject
export class Shell implements ConfiguresRouter {
  router: Router;
  routes: RouteConfig[];

  constructor(routes: FeatureRoutes) {
    this.routes = routes.routes;
  }

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = $('head title').text();
    config.map(this.routes);
    this.router = router;
  }
}
