import { ContextParam } from '../context/context-param.interface';
import { AdaptationRule } from './adaptation-rule.interface';
import { AdaptationAction } from '../ui/adaptation-action.interface';

/**
 * This component type is used to evaluate Adaptation Rules based on Context Parameters.
 * It triggers Adaptation Actions (defined in rules), if a rules condition is satisfied.
 */
export abstract class RuleEvaluator {

  /**
   * Evaluate given set of Adaptation Rules based on given set of Context Parameters.
   * Call adaptation callback method to trigger UI adaptation by providing an Adaptation Action.
   * @param rules
   * @param contextParams
   * @param adaptation
   */
  public abstract evaluate(rules: AdaptationRule[], contextParams: ContextParam[], adaptation: (action: AdaptationAction) => any);
}
