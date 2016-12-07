import { ConfiguresRouter, Router, RouterConfiguration } from 'aurelia-router';

export class App implements ConfiguresRouter {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = $('head title').text();
    config.map([
      { route: ['', 'welcome'], name: 'welcome', moduleId: './welcome', nav: true, title: 'Welcome' },
      { route: ['users', 'users/:username'], name: 'users', moduleId: './users', nav: true, title: 'Github Users',  },
      { route: 'child-router', name: 'child-router', moduleId: './child-router', nav: true, title: 'Child Router' }
    ]);

    this.router = router;
  }
}
