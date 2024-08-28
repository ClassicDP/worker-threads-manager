/// <reference types="node" />
import { MessagePort } from 'worker_threads';
export type WorkerMessageType = 'request' | 'response' | 'run' | 'workerAdded' | 'workerRemoved' | 'acknowledge' | 'updatePort' | 'selfId' | 'functionCall' | 'functionResponse' | 'functionCallRequest' | 'functionCallResponse';
export interface WorkerMessage {
    type: WorkerMessageType;
    workerId?: number;
}
export interface WorkerCommand extends WorkerMessage {
    commandId: number;
}
export interface UpdatePortCommand extends WorkerCommand {
    type: 'updatePort';
    workerId: number;
    port: MessagePort;
}
export declare class WorkerManager {
    private workers;
    private nextId;
    private nextCommandId;
    private acknowledgementResolves;
    createWorker(workerFile: string): Promise<number>;
    sendCommand<T extends WorkerCommand>(workerId: number, type: WorkerMessageType, params?: Omit<T, 'type' | 'commandId'>): Promise<void>;
    getNextCommandId(): number;
    terminateWorker(workerId: number): Promise<void>;
    private notifyWorkersAboutRemoval;
    private setupMessageChannels;
}
