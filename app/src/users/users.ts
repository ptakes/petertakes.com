import { autoinject } from 'aurelia-framework';
import { RoutableComponentActivate } from 'aurelia-router';

import { IUser } from './user';
import { UsersService } from './users-service';

@autoinject
export class Users implements RoutableComponentActivate {
  heading: string = 'Users';
  users: Array<IUser> = [];

  constructor(private userService: UsersService) {
  }

  async activate(params: any): Promise<void> {
    if (params.username) {
      this.users = [await this.userService.getUser(params.username)];
    }
    else {
      this.users = await this.userService.getUsers();
    }
  }
}
