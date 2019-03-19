import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { AdaptationController } from '../core/adaptation-controller';
import { ContextParam } from './context-param.interface';

export enum UpdateMethod {
  EVENT_BASED = 'event-based',
  INTERVAL = 'interval'
};

/**
 * Base Class for "Context Provider" components.
 * Context Providers obtain information about the context of use (user, platform, environment) and report changes.
 * Provides base structure and functionality
 */
export abstract class ContextProvider {

  /** Holds array of context parameters */
  private contextParams: ContextParam[] = [];

  /** An observable stream, that can be subscribed to */
  private contextParams$: BehaviorSubject<ContextParam[]> = new BehaviorSubject<ContextParam[]>([]);

  /**
   * Constructor injects an Adaptation Controller component and receives configuration options
   * If updateMethod is chosen to be interval based, setup update interval
   * @param method
   * @param time
   */
  protected constructor(method: UpdateMethod, time: number = 10000) {
    // setup update interval
    if (method == UpdateMethod.INTERVAL) {
      const updateInterval = () => {
        this.updateContext();
      };
      setInterval(updateInterval, time);
    }
  }

  /**
   * Register a new context parameter to this Context Provider
   * @param newParam
   */
  protected addContextParam(newParam: ContextParam) {
    if (this.contextParams.filter(param => param.key === newParam.key)) {
      this.contextParams.push(newParam);
    }
  }

  /**
   * Remove context parameter with given key from this Context Provider
   * @param key
   */
  protected removeContextParam(key: string) {
    this.contextParams = this.contextParams.filter(param => param.key !== key);
  }

  /**
   * Returns a context parameter with given key
   * @param key
   */
  protected getContextParam(key: string) {
    return this.contextParams.find(param => param.key == key);
  }

  /**
   * Modifies the value of a context parameter with given key
   * Notice: Does not implicitly report context update to observers.
   * @param key
   * @param newValue
   */
  protected modifyContextParam(key: string, newValue: any) {
    let oldParam = this.getContextParam(key);
    if (oldParam) {
      this.removeContextParam(key);
      this.addContextParam({contextOfUse: oldParam.contextOfUse, type: oldParam.type, key: oldParam.key, value: newValue});
    }
  }

  /** Return observable stream of context information */
  public getObservable() {
    return this.contextParams$.asObservable();
  }

  /** Update and emit context information to observers */
  protected updateContext() {
    this.contextParams$.next(this.contextParams);
  }
}
