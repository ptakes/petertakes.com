import { lazy } from 'aurelia-framework';
import { HttpClient } from 'aurelia-fetch-client';
import { RoutableComponentActivate } from 'aurelia-router';
import 'isomorphic-fetch';

interface IUser {
  avatar_url: string;
  login: string;
  html_url: string;
}

export class Users implements RoutableComponentActivate {
  heading: string = 'Github Users';
  users: Array<IUser> = [];
  http: HttpClient;

  constructor( @lazy(HttpClient) private getHttpClient: () => HttpClient) {
  }

  async activate(params: any): Promise<void> {
    const http = this.http = this.getHttpClient();

    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('https://api.github.com/');
    });

    const response = await http.fetch(`users${params.username ? `/${params.username}` : ''}`);
    const users = await response.json();
    this.users = users instanceof Array ? users : [users];
  }
}
