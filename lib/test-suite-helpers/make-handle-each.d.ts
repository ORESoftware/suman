import { IEachHookObj, ITestSuite } from "../../dts/test-suite";
import { ISuman } from "../../dts/suman";
declare const _default: (suman: ISuman, gracefulExit: Function) => (self: ITestSuite, test: any, aBeforeOrAfterEach: IEachHookObj, cb: Function) => any;
export = _default;
