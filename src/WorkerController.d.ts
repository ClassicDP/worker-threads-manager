type FunctionWithArgs = (...args: any[]) => any;
type FunctionWithoutArgs = () => any;
export type HandlerFunction = FunctionWithArgs | FunctionWithoutArgs | any;
export interface Handlers {
    [key: string]: HandlerFunction;
}
export type HandlerArgs<T extends Handlers, K extends keyof T> = T[K] extends (...args: infer A) => any ? A : never;
export type HandlerReturn<T extends Handlers, K extends keyof T> = T[K] extends (...args: any[]) => infer R ? R : never;
export declare class WorkerController {
    private static messageId;
    private ports;
    private responseHandlers;
    private readonly handlers?;
    private readonly usingSerialisation;
    private readonly boundHandleIncomingMessage;
    private selfId;
    constructor(handlers?: Handlers, usingSerialisation?: boolean);
    private static getNextMessageId;
    getWorkersId(): number[];
    call<C extends Handlers, K extends keyof C>(workerId: number, classType: {
        new (): C;
    }, methodName: K, ...args: Parameters<C[K]>): Promise<ReturnType<C[K]>>;
    id(): string;
    private handleIncomingMessage;
    private acknowledge;
    private handleUpdatePort;
    private handleIncomingMessageFromPort;
}
export {};
