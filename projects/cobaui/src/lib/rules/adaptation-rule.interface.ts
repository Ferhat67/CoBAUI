import { AdaptationAction } from '../ui/adaptation-action.interface';

/**
 * This interface defines the structure of an Adaptation Rule.
 * A rule consists of a condition and is identified by a name.
 * It specifies a number of Adaptation Actions
 */
export interface AdaptationRule {

  /** Name for the rule, for identification purposes */
  name: string;

  /** Conditions that should be evaluated */
  condition: string;

  /** Actions that should be triggered */
  actions: AdaptationAction[];
}
