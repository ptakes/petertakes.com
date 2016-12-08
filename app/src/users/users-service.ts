import { autoinject } from 'aurelia-framework';
import { HttpClient } from 'aurelia-fetch-client';
import 'isomorphic-fetch';

import { IUser } from './user';

@autoinject
export class UsersService {
  constructor(private http: HttpClient) {
    http.configure(config => {
      config
        .useStandardConfiguration()
        .withBaseUrl('/api/');
    });
  }

  async getUser(username: string): Promise<IUser> {
    const response = await this.http.fetch(`users/${username}`);
    return await response.json();
  }

  async getUsers(): Promise<IUser[]> {
    const response = await this.http.fetch('users');
    return await response.json();
  }
}
