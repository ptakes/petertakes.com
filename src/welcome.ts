import { computedFrom } from 'aurelia-framework';
import { RoutableComponentCanDeactivate } from 'aurelia-router';

export class Welcome implements RoutableComponentCanDeactivate {
  heading: string = 'Welcome to the Peter Takes App';
  firstName: string = 'Peter';
  lastName: string = 'Takes';
  previousValue: string = this.fullName;

  @computedFrom('firstName', 'lastName')
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  submit(): void {
    this.previousValue = this.fullName;
    alert(`Welcome, ${this.fullName}!`);
  }

  canDeactivate(): boolean {
    if (this.fullName !== this.previousValue) {
      return confirm('Are you sure you want to leave?');
    }
    return true;
  }
}

export class UpperValueConverter {
  toView(value: string): string {
    return value && value.toUpperCase();
  }
}
