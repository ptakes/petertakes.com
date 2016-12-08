import { lazy } from 'aurelia-framework';
import { HttpClient } from 'aurelia-fetch-client';
import { RoutableComponentActivate } from 'aurelia-router';
import 'isomorphic-fetch';

interface IUser {
  avatarUrl: string;
  contactUrl: string;
  login: string;
}

export class Users implements RoutableComponentActivate {
  heading: string = 'Users';
  users: Array<IUser> = [];
  http: HttpClient;

  constructor( @lazy(HttpClient) private getHttpClient: () => HttpClient) {
  }

  async activate(params: any): Promise<void> {
    const http = this.http = this.getHttpClient();

    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('/api/');
    });

    const response = await http.fetch(`users${params.username ? `/${params.username}` : ''}`);
    const users = await response.json();
    this.users = users instanceof Array ? users : [users];
  }
}
