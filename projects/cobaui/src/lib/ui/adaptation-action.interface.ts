/**
 * Defines the structure of an Adaptation Action
 */
export interface AdaptationAction {

  /** Name of targeted widget component class */
  target: string;

  /** Namespaces, that the rule should apply to */
  scope?: string[];

  /** Action that should be triggered for adaptation */
  name: string;

  /** Additional parameters for the action */
  params?: { [key: string]: any };
}
