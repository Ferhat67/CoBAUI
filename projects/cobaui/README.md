# CoBAUI Framework
## Component-Based Adaptive User Interface

This framework aims to facilitate the development of adaptive UIs 
by introducing a modular architecture to support UI adaptation at widget-level.
CoBAUI incorporates different types of components to address different concerns of an adaptive UI.

The following components are defined by the framework.
* **Context Provider**
  * Used for monitoring and obtaining contextual information from various sources (sensors, network, application, etc.).
  * Allows preparation and processing of raw contextual information in form of "Context Parameters".
  * Provides latest set of Context Parameters to observers by using RxJS Observables.
* **Rule Provider**
  * Used to obtain and provide Adaptation Rules at runtime.
  * Load rules in JSON format and deserialize in order to maintain a set of rules.
  * Supports dynamic adding and removing of rules at runtime.
  * Propagates changes to rules set to observers.
* **Rule Evaluator**
  * Used to evaluate Adaptation Rules based on latest Context Parameters and to conditionally actuate UI adaptation.
  * Supports the use of different strategies for the evaluation process (e.g. Rule Engines).
  * Trigger Adaptation Actions when a rule's condition applies to given contextual information.
* **Adaptive Widget**
  * Extended UI component.
  * Used to define and encapsulate the adaptive functionality for a UI portion.
  * Listens for Adaptation Action events and adapts at runtime.

The CoBAUI framework contains an abstract base class definition for each component type, providing common
functionality and ensuring compatibility of components.
Concrete implementation for these components must be implemented by the actual Angular application 
by inheriting and extending the base classes.

In order to form a coherent adaptive UI and enable communication between components, a further component is
provided by the framework.

* **Adaptation Controller**
  * Used as central connecting component to achieve communication between multiple components in a decoupled manner.
  * Allows flexible addition and removal of multiple Context Provider, Rule Provider and Adaptive Widget components.
  * Merges Context Parameters and Rule Providers from different sources (components).
  * Initiates evaluation process.
  * Propagates Adaptation Actions.
  * Requires one Rule Evaluator component.

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.6.

## Integration into an Angular application

1. Run `npm install cobaui --save` to import the framework into your project.
2. Add the `CoBAUIModule` into the `imports` array of the Angular applications _AppModule_ class in _app.module.ts_.
    ```typescript
    import { CoBAUIModule } from 'cobaui';
    ```
    ```typescript
    @NgModule({
      imports: [
        BrowserModule,
        CoBAUIModule // Import CBAUI Framework into application
      ]
    })
    ```
3. Initialize Adaptation Controller in _AppModule_ class by injecting the AdaptationController component provided by the CoBAUI framework.

    ```typescript
    import { AdaptationController } from 'cobaui';
    ```
    ```typescript
    export class AppModule {
     // Inject Adaptation Controller
     constructor(ac: AdaptationController) {
         // Register components to Adaptation Controller to initialize Adaptive UI
     }
    }
    ```

## Implementation of components

To implement components, extend provided base class for desired component type.
In the following, examples for each component type is given.

#### Context Provider
The following Context Provider `HandednessCP` monitors the inclination of the device
by accessing the gyroscope sensor through the browsers `DeviceOrientationEvent` API.
If the device inclination exceeds 30° or falls below -30° it is inferred, whether the 
user is left-handed or right-handed.
HandednessCP is an Angular Service, hence `@Injectable` and extends the `ContextProvider` base class.

```typescript
import { Injectable } from '@angular/core';
import { ContextProvider, UpdateMethod } from 'cobaui';

@Injectable()
export class HandednessCP extends ContextProvider {

  constructor() {
    // call base class constructor. set update method to event based
    super(UpdateMethod.EVENT_BASED);
    // Initialize context parameter for handedness
    this.addContextParam({contextOfUse: 'user', key: 'handedness', value: 'unknown'});
    this.monitorDeviceInclination(); // Start monitoring device inclination
  }

  monitorDeviceInclination() {
    if ('DeviceOrientationEvent' in window)
      window.addEventListener('deviceorientation', (angles) => this.inferHandedness(angles.gamma), false);
  }

  inferHandedness(inclinationAngle: number) {
    if (inclinationAngle > 30 && this.getContextParam('handedness').value != 'left') {
      this.modifyContextParam('handedness', 'left');
      this.updateContext();
    }
    else if (inclinationAngle < -30 && this.getContextParam('handedness').value != 'right') {
      this.modifyContextParam('handedness', 'right');
      this.updateContext();
    }
  }
}
```
The update method for the Context Provider configured to be `EVENT_BASED`, which means, 
an updated set of Context Parameters is published once the `updateContext()` method is called.
Alternatively, there exists an `INTERVAL` update method, which forces automatic
publication in a specified time interval.
Updated Context Parameters can be obtained by observers (in particular Adaptation Controller).

#### Rule Provider

The `LocalRP` Rule Provider component loads Adaptation Rules from a JSON file located
in the applications `assets/` directory.
It uses Angulars `HttpClient` service to access the `adaptation-rules.json` file and
deserializes its contents as Adaptation Rules.

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RuleProvider } from 'cobaui';

@Injectable()
export class LocalRP extends RuleProvider{

  constructor(http: HttpClient) {
    super();

    // load rules
    http.get<any[]>('assets/adaptation-rules.json').subscribe(rules => {
      if (rules && rules.length)
        rules.forEach(rule => this.addRule(rule));
    })
  }
}
```
Rules are then published to observers (in particular Adaptation Controller).
The Rule Provider is implemented as Angular Service and as such can be 
injected by other Angular
Components and Services (i.e. other CoBAUI components).


#### Rule Evaluator

One approach to implement a Rule Evaluator component is by using a 
rule engine like _Nools_.
Like the other components, a Rule Evaluator is an Angular Service and extends the `RuleEvaluator` base class.
In the following an excerpt of an `NoolsRE` Rule Evaluator is depicted.

```typescript
import { Injectable } from '@angular/core';
import { RuleEvaluator, ContextParam, AdaptationRule, AdaptationAction, AdaptationController  } from 'cobaui';
import * as nools from 'nools';

@Injectable()
export class NoolsRE extends RuleEvaluator {

  public evaluate(rules: AdaptationRule[], contextParams: ContextParam[], adaptation: (action: AdaptationAction) => any) {
    
    if (!rules || rules.length === 0)
      return;

    // Define a model to work with Context facts in nools rules
    const noolsContextModel = `define Context { user:{}, platform:{}, environment:{} } \n`;
    // Transform Adaptation Rules to nools DSL format
    const noolsRules = noolsContextModel + this.transformRules(rules);

    // define "adaptation" function
    const fireAdaptation = function (target, scope, action, params) {
      // Transform adaptation call from rule to AdaptationAction and execute callback
      adaptation({ target, scope, name: action, params });
    };
    // Build a nools flow from adaptation rules. 
    this.createFlow(noolsRules, { adaptation: fireAdaptation });

    // Create a new nools session from flow
    this.session = this.flow.getSession();
    // Insert facts into the nools session. Facts are Context Parameters
    const Context = this.flow.getDefined("Context");
    let context = new Context({user:{}, platform:{}, environment:{}});
    Object.values(contextParams).forEach(param => {
      context[param.contextOfUse][param.key] = param.value;
    });
    this.session.assert(context);

    // finally, start rule evaluation
    this.session.match((err) => {
      if (err) {
        console.error(err.stack);
      }
    });
  }
}
```
In the `evaluate` method the given Adaptation Rules are transformed to be used as Nools rules.
Context Parameters are transformed to `facts` to be used by Nools.
Finally, the evaluation process is started.
Rules are evaluated and specified Adaptations are triggered by the rule engine.


#### Adaptive Widget

Adaptive Widgets extend UI Components of Angular with functionality to adapt at runtime.
Like regular Angular Components, Adaptive Widgets can have `@Input` attributes and `@Output` events
to communicate with other UI components and be configurable.
The `HideableButtonAWComponent` shown below extends the `AdaptiveWidget` base class provided
by the CoBAUI framework.
In its constructor, the `AdaptationController` is injected for registration purposes and a name is chosen
to identify this Adaptive Widget.
To further distinguish individual instances of this widget, a `namespace` attribute can be applied.

```typescript
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AdaptationAction, AdaptationController, AdaptiveWidget} from 'cobaui';

@Component({
  selector: 'hideable-button-aw',
  templateUrl: './hideable-button-aw.component.html',
  styleUrls: ['./hideable-button-aw.component.css']
})
export class HideableButtonAWComponent extends AdaptiveWidget{

  @Input('namespace') namespace: string;
  @Input('icon') icon: string;
  @Input('label') label: string;
  @Output('click') onClick: EventEmitter<any> = new EventEmitter();

  visible: boolean = true;

  constructor(ac: AdaptationController) {
    super(ac, "HideableButtonAW");
  }

  adapt(action: AdaptationAction): void {
    switch (action.name) {
      case 'HIDE':
        this.visible = false;
        break;
      case 'SHOW':
        this.visible = true;
        break;
    }
  }
}
```
In the the `adapt` method, the adaptation features for the widget are implemented.
This simple widget supports two Adaptation Actions `HIDE` and `SHOW` to conditionally hide
the button at runtime.


#### Adaptation Rules

```json
[
  {
    "name": "USER_IS_RIGHT_HANDED",
    "condition": "c.user.handedness == 'right'",
    "actions": [
      {"name": "SHOW", "params": {}, "target": "HideableButtonAW", "scope":  ["rightBtn"]},
      {"name": "HIDE", "params": {}, "target": "HideableButtonAW", "scope":  ["leftBtn"]}
    ]
  },
  {
    "name": "USER_IS_LEFT_HANDED",
    "condition": "c.user.handedness == 'left'",
    "actions": [
      {"name": "HIDE", "params": {}, "target": "HideableButtonAW", "scope":  ["rightBtn"]},
      {"name": "SHOW", "params": {}, "target": "HideableButtonAW", "scope":  ["leftBtn"]}
    ]
  }
]
```
In this example, there are two `HideableButtonAW` Adaptive Widget instances in the UI,
distinguished by their `namespace` attribute.
The two Adaptation Rules check if the user is either left-handed or right-handed.
If the `condition` applies to the current context-of-use information, two actions are
specified in each rule to trigger a `HIDE` or `SHOW` Adaptation Adaptation for the targeted widget
based on its name (`target`) and its namespace (`scope`).


## Setup

In order for the components to form a coherent and operable adaptive UI, they must be registered with an 
Adaptation Controller component.

1. Go to the constructor of the AppModule class where the `AdaptationController` is injected.
2. Register your components as follows:

    ```typescript
    export class AppModule {
      constructor(ac: AdaptationController) {
        // register Context Providers
        ac.registerContextProvider(HandednessCP);
        ac.registerContextProvider(NetworkCP);
        ac.registerContextProvider(UserInfoCP);
        ac.registerContextProvider(CameraInfoCP);
        // register Rule Providers
        ac.registerRuleProvider(LocalRP);
        ac.registerRuleProvider(DatabaseRP);
        ac.registerRuleProvider(GeneratedRP);
        // register Rule Evaluator
        ac.registerRuleEvaluator(NoolsRE);
      }
    }
    ```
    Note that Adaptive Widget components are registered automatically by Dependency Injection.
