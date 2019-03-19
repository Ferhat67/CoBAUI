import { Injectable, InjectionToken, Injector, Type } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { ContextParam } from '../context/context-param.interface';
import { ContextProvider } from '../context/context-provider.base';
import { AdaptationRule } from '../rules/adaptation-rule.interface';
import { AdaptationAction } from '../ui/adaptation-action.interface';
import { RuleProvider } from '../rules/rule-provider.base';
import { RuleEvaluator } from '../rules/rule-evaluator.base';

/**
 * The Adaptation Controller is the core component of an adaptive UI.
 * It receives context information from Context Providers and evaluates Adaptation Rules via a Rule Engine session
 * to trigger adaptations on Adaptive Widgets in the UI.
 */
@Injectable()
export class AdaptationController {

  private injector: Injector;

  /** Keeps track of registered context provider components */
  private readonly contextProviders: ContextProvider[] = [];

  /** Keeps track of registered rule provider components */
  private readonly ruleProviders: RuleProvider[] = [];

  /** Observable stream of the context of use */
  private readonly context$: BehaviorSubject<ContextParam[]> = new BehaviorSubject<ContextParam[]>([]);

  /** Observable stream of adaptation rules */
  private readonly rules$: BehaviorSubject<AdaptationRule[]> = new BehaviorSubject<AdaptationRule[]>([]);

  /** Rule evaluator for evaluating rules */
  private ruleEvaluator: RuleEvaluator;

  /** Observable stream of Adaptation Actions */
  private readonly adaptationActions$: Subject<AdaptationAction> = new Subject<AdaptationAction>();

  /** Keeps track of subscriptions to observables */
  private cpSubscription: Subscription = new Subscription();
  private rpSubscription: Subscription = new Subscription();

  /**
   * Constructor: Inject Angulars Dependency Injector
   */
  constructor(injector: Injector) {
    this.injector = injector;
  }

  /**
   * Register a Rule Evaluator component
   * @param ruleEvaluatorToken
   */
  public registerRuleEvaluator(ruleEvaluatorToken: Type<RuleEvaluator> | InjectionToken<RuleEvaluator>): void {
    this.ruleEvaluator = this.injector.get<RuleEvaluator>(ruleEvaluatorToken);
  }

  /**
   * Registers a Context Provider to monitor context information.
   * Update set of context parameters when a change occurs.
   * @param contextProviderToken
   */
  public registerContextProvider(contextProviderToken: Type<ContextProvider> | InjectionToken<ContextProvider>): void {
    // Inject and initialize Context Provider component as a Angular Service
    const contextProvider = this.injector.get<ContextProvider>(contextProviderToken);
    // add new component to list of Context Providers
    this.contextProviders.push(contextProvider);
    // get array of observables from all Context Providers
    const contextProviders = this.contextProviders.map(cp => cp.getObservable());
    // merge context parameters from all Context Providers
    const mergedContext$ = combineLatest(...contextProviders).pipe(map(nestedParams => [].concat(...nestedParams)));
    // observe changes to merged context and trigger evaluation process
    this.cpSubscription.unsubscribe();
    this.cpSubscription = mergedContext$.subscribe(params => this.updateContext(params));
  }

  /**
   * Register a Rule Provider component
   * Update set of rules when a change occurs
   * @param ruleProviderToken
   */
  public registerRuleProvider(ruleProviderToken: Type<RuleProvider> | InjectionToken<RuleProvider>): void {
    // Inject and initialize Rule Provider component as a Angular Service
    const ruleProvider = this.injector.get<RuleProvider>(ruleProviderToken);
    // add new component to list of Rule Providers
    this.ruleProviders.push(ruleProvider);
    // get array of observables from all Rule Providers
    const ruleProviders = this.ruleProviders.map(rp => rp.getObservable());
    // merge context parameters from all Rule Providers
    const mergedRules$ = combineLatest(...ruleProviders).pipe(map(nestedParams => [].concat(...nestedParams)));
    // observe changes to merged rules and trigger evaluation process
    this.rpSubscription.unsubscribe();
    this.rpSubscription = mergedRules$.subscribe(rules => this.updateRules(rules));
  }

  /**
   * Update context parameters and trigger evaluation process
   * @param contextParams
   */
  private updateContext(contextParams: ContextParam[]) {
    console.debug("AC: Context updated", contextParams);
    this.context$.next(contextParams);
    this.evaluateAdaptationRules();
  }

  /**
   * Update adaptation rules and trigger evaluation process
   * @param rules
   */
  private updateRules(rules: AdaptationRule[]) {
    console.debug("AC: Rules updated", rules);
    this.rules$.next(rules);
    this.evaluateAdaptationRules();
  }

  /**
   * Start evaluation process, if a Rule Evaluator is specified
   */
  private evaluateAdaptationRules() {
    if (this.ruleEvaluator)
      this.ruleEvaluator.evaluate(this.getRules(), this.getContext(), (action) => this.fireAdaptation(action));
    else
      console.log("AUI: Evaluation could not be started. No RuleEvaluator set.");
  }

  /**
   * Fire an Adaptation Action
   * Notify observers (Adaptive Widgets) about an Adaptation Action
   * @param action
   */
  private fireAdaptation(action: AdaptationAction) {
    this.adaptationActions$.next(action);
    console.debug("Adaptation Controller: AdaptationAction triggered", action);
  }

  /** An observable stream of Adaptation Actions */
  public get AdaptationActions() {
    return this.adaptationActions$.asObservable();
  }

  /** Returns current context parameters */
  public getContext(): ContextParam[] {
    return this.context$.getValue();
  }

  /** An observable stream of context paramteres */
  public get Context() {
    return this.context$.asObservable();
  }

  /** Returns current set adaptation rules */
  public getRules(): AdaptationRule[] {
    return this.rules$.getValue();
  }
}
