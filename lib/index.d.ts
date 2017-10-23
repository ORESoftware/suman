import { IInitFn } from "suman-types/dts/index-init";
export { ISumanOpts, IGlobalSumanObj } from 'suman-types/dts/global';
export { ITestCaseParam } from 'suman-types/dts/test-suite';
export { IHookParam } from 'suman-types/dts/test-suite';
export { IDescribeFn } from 'suman-types/dts/describe';
export { ItFn, ITestDataObj } from 'suman-types/dts/it';
export { IBeforeFn } from 'suman-types/dts/before';
export { IBeforeEachFn } from 'suman-types/dts/before-each';
export { IAfterFn } from 'suman-types/dts/after';
export { IAfterEachFn } from 'suman-types/dts/after-each';
export declare const init: IInitFn;
export declare const autoPass: (t: any) => void;
export declare const autoFail: (t: any) => Promise<never>;
export declare const once: (fn: Function) => (cb: Function) => void;
declare const $exports: any;
export default $exports;
