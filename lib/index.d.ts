import { IInitFn } from "suman-types/dts/index-init";
import * as s from './s';
export { s };
import sumanRun = require('./helpers/suman-run');
import { ISumanRunFn } from "./helpers/suman-run";
export declare const init: IInitFn;
export declare const autoPass: (t: any) => void;
export declare const autoFail: (t: any) => Promise<never>;
export declare const run: sumanRun.ISumanRunFn;
export declare const once: (fn: Function) => (cb: Function) => void;
export declare const version: any;
export interface ISumanExports {
    s: typeof s;
    init: IInitFn;
    run: ISumanRunFn;
    autoPass: typeof autoPass;
    autoFail: typeof autoFail;
}
declare const _default: ISumanExports;
export default _default;
