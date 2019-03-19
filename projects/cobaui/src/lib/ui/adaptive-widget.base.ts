import { Input, Output, OnDestroy, OnInit, EventEmitter } from '@angular/core';
import { AdaptationController } from '../core/adaptation-controller';
import { AdaptationAction } from './adaptation-action.interface';
import { filter, map } from 'rxjs/operators';

/**
 * An AdaptiveWidget is a UI Component extended by adaptive functionality.
 * It defines and implements adaptations for itself, encapsulating the adaptation logic to the outside.
 * Adaptations can take various effects on the Widget, like changing its layout, modality or behaviour.
 */
export abstract class AdaptiveWidget implements OnInit, OnDestroy{

  /**
   * The namespace specifies a scope in which the widget adaptations are triggered.
   * This allows for more control over applying rules to certain instances or groups of this widget.
   */
  @Input('aui-namespace') public namespace: string = '';

  /**
   * The Adaptation Controller is injected to enable and control dynamic context adaptation at runtime.
   * @param adaptationController
   * @param name
   */
  protected constructor(private adaptationController: AdaptationController, private name: string) {
    this.setupAdaptivity();
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  /**
   * Register to the Adaptation Controller and listen for Adaptation Actions.
   * Check if Adaptation Action is addressed to this widget and perform given adaptation.
   */
  private setupAdaptivity() {
    this.adaptationController.AdaptationActions
      .pipe(filter(action => action.target === this.name && (action.scope.length === 0 || action.scope.includes(this.namespace))))
      .subscribe(action => this.adapt(action));
  }


  /**
   * Here the adaptation capabilities of the widget are implemented.
   * This function is meant to be overridden by inheriting widgets.
   * @param action
   */
  public adapt(action: AdaptationAction) {
    console.debug(`Widget (${this.name}/${this.namespace}): Action '${action.name}' performed`, action);
  }
}
