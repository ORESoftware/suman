/// <reference types="node" />
import { IPseudoError } from "suman-types/dts/global";
import { IHookObj } from "suman-types/dts/test-suite";
import { ITestDataObj } from "suman-types/dts/it";
import { VamootProxy } from "vamoot";
import EE = require('events');
export declare class ParamBase extends EE {
    protected __hook: IHookObj;
    protected __test: ITestDataObj;
    protected __handle: Function;
    protected __shared: VamootProxy;
    protected __fini: Function;
    constructor();
    done(): void;
    skip(): void;
    fatal(err: IPseudoError): void;
    set(k: string, v: any): boolean;
    get(k?: string): any;
    getValues(...args: Array<string>): any[];
    getMap(...args: Array<string>): any;
    wrap(fn: Function): () => any;
    wrapFinal(fn: Function): () => void;
    final(fn: Function): void;
    log(...args: Array<string>): void;
    slow(): void;
    wrapFinalErrorFirst(fn: Function): (err: Error) => any;
    wrapErrorFirst(fn: Function): (err: IPseudoError) => any;
    handleAssertions(fn: Function): any;
}
export interface ParamBase {
    pass: typeof ParamBase.prototype.done;
    ctn: typeof ParamBase.prototype.done;
    fail: typeof ParamBase.prototype.done;
    wrapFinalErrFirst: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapFinalErr: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapFinalError: typeof ParamBase.prototype.wrapFinalErrorFirst;
    wrapErrFirst: typeof ParamBase.prototype.wrapErrorFirst;
}