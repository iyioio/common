import { DependencyContainer } from "./DependencyContainer";

/**
 * A shared global DependencyContainer. Library functions and classes should avoid using globalDeps
 * an instead accept a reference to a DependencyContainer and allow end application code to supply
 * either a created DependencyContainer instance or globalDeps. Library code may also use globalDeps
 * as default or fallback value.
 */
export const globalDeps=new DependencyContainer();
