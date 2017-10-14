import { ITestSuite } from "suman-types/dts/test-suite";
import { ISumanInputs } from "suman-types/dts/suman";
import { ITestDataObj } from "suman-types/dts/it";
export interface ITestBlockMethodCache {
    [key: string]: Object;
}
export declare class Suman {
    ctx?: ITestSuite;
    interface: string;
    $inject: Object;
    private __inject;
    testBlockMethodCache: Map<Function, ITestBlockMethodCache>;
    iocData: Object;
    force: boolean;
    fileName: string;
    slicedFileName: string;
    timestamp: number;
    sumanId: number;
    allDescribeBlocks: Array<ITestSuite>;
    describeOnlyIsTriggered: boolean;
    deps: Array<string>;
    usingLiveSumanServer: boolean;
    numHooksSkipped: number;
    numHooksStubbed: number;
    numBlocksSkipped: number;
    rootSuiteDescription: string;
    dateSuiteFinished: number;
    dateSuiteStarted: number;
    filename: string;
    itOnlyIsTriggered: boolean;
    extraArgs: Array<string>;
    sumanCompleted: boolean;
    desc: string;
    getQueue: Function;
    constructor(obj: ISumanInputs);
    getTableData(): void;
    logFinished($exitCode: number, skippedString: string, cb: Function): void;
    logResult(test: ITestDataObj): void;
}
export declare type ISuman = Suman;
export declare const makeSuman: ($module: NodeModule, _interface: string, opts: any) => any;
