import { FrameworkConfiguration } from 'aurelia-framework';
import { FeatureConfiguration } from '../feature';
import { routes } from './routes';

export function configure(config: FrameworkConfiguration, featureConfig: FeatureConfiguration): void {
  featureConfig.routes = routes;
}
