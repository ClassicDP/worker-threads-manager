import { Handlers } from '../src';
export declare class MyWorkerHandlers implements Handlers {
    processData(data: string): Promise<string>;
    calculateSum(a: number, b: number): Promise<number>;
}
