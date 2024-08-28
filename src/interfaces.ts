// src/interfaces.ts
export interface Interfaces {
    type: 'request' | 'response' | 'notification' | 'initialization';
}

export interface RequestMessage<T> extends Interfaces {
    type: 'request';
    requestId: number;
    payload: T;
}

export interface ResponseMessage<T> extends Interfaces {
    type: 'response';
    requestId: number;
    result: T;
}

export interface NotificationMessage<T> extends Interfaces {
    type: 'notification';
    payload: T;
}

export interface InitializationMessage extends Interfaces {
    type: 'initialization';
}

type FunctionWithArgs = (...args: any[]) => any
type FunctionWithoutArgs = () => any

export type HandlerFunction = FunctionWithArgs | FunctionWithoutArgs | any

export interface Handlers {
    [methodName: string]: HandlerFunction
}