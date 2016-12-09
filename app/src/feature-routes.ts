import { RouteConfig } from 'aurelia-router';

export class FeatureRoutes {
  routes: RouteConfig[] = [];

  map(routes: RouteConfig[]): void {
    this.routes = [...this.routes, ...routes];
  }
}
