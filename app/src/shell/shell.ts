import { ConfiguresRouter, Router, RouterConfiguration } from 'aurelia-router';

export class Shell implements ConfiguresRouter {
  router: Router;

  configureRouter(config: RouterConfiguration, router: Router): void {
    config.title = $('head title').text();
    config.map([
      { route: ['', 'welcome'], name: 'welcome', moduleId: '../home/welcome', nav: true, title: 'Welcome' },
      { route: ['users', 'users/:username'], name: 'users', moduleId: '../users/users', nav: true, title: 'Users',  }
    ]);

    this.router = router;
  }
}
