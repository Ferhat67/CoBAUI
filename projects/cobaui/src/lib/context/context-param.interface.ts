export type ContextOfUse = "user" | "platform" | "environment";
export type ContextValueType = "string" | "number" | "boolean" | "array" | "object";

/**
 * A simple object structure that contain multiple Context Parameters.
 * It is used to describe the applications context of use with all its parameters.
 */
export interface IContext {
  [name: string]: ContextParam;
}

/**
 * Context Parameters contain certain information about the context of use.
 * It provides further meta data and a key to identify the context information.
 */
export interface ContextParam {
  readonly contextOfUse: ContextOfUse;
  readonly type?: ContextValueType;
  readonly key: string;
  readonly value: any;
}
