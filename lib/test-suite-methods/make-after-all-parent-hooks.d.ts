import { ITestSuite } from "suman-types/dts/test-suite";
import { Suman } from "../suman";
import { IAfterFn } from "suman-types/dts/after";
export declare const makeAfterAllParentHooks: (suman: Suman, zuite: ITestSuite) => IAfterFn;
