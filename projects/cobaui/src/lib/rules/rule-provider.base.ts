import { AdaptationRule } from './adaptation-rule.interface';
import { BehaviorSubject } from 'rxjs';

/**
 * This component type is used to obtain, manage and provide Adaptation Rules.
 */
export abstract class RuleProvider {

  /** Set of adaptation rules */
  protected rules: AdaptationRule[];

  /** Observable set of adaptation rules */
  private rules$: BehaviorSubject<AdaptationRule[]>;

  /**
   * Constructor: Initialize empty set of rules
   */
  protected constructor() {
    this.rules = [];
    this.rules$ = new BehaviorSubject<AdaptationRule[]>([]);
  }

  /**
   * Publish rules to observers
   */
  protected updateRules(): void {
    this.rules$.next(this.rules);
  }

  /**
   * Add a rule to the set of rules and notify observers
   */
  public addRule(rule: AdaptationRule): void {
    this.rules.push(rule);
    this.rules$.next(this.rules);
  }

  /**
   * Remove a rule with given name and notify observers
   */
  public removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
    this.rules$.next(this.rules);
  }

  /**
   * Return observable stream of rules that can be subscribed to by observers
   */
  public getObservable() {
    return this.rules$.asObservable();
  }
}
