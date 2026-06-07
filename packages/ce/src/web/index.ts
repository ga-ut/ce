import { CE } from "./ce";

export { CE, effect, html, match } from "./ce";
export type { BindToken, DefineParams, RenderContent, Signal, Template } from "./ce";

export const define = CE.define.bind(CE) as typeof CE.define;
export const signal = CE.signal.bind(CE) as typeof CE.signal;
export const derived = CE.derived.bind(CE) as typeof CE.derived;
export const navigate = CE.navigate.bind(CE) as typeof CE.navigate;
export const setEntryPoint = CE.setEntryPoint.bind(CE) as typeof CE.setEntryPoint;
export const renderRouteToString = CE.renderRouteToString.bind(
  CE
) as typeof CE.renderRouteToString;
