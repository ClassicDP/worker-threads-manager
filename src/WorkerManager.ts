import { Worker } from 'worker_threads';
import { InitializationMessage, RequestMessage, ResponseMessage, NotificationMessage, Handlers } from './interfaces';
import {Class, SerDe} from "serde-ts";

export class WorkerManager<HandlersType extends Handlers> {
    private workers: Map<number, Worker> = new Map();
    private requestIdCounter: number = 0;
    private workerIdCounter: number = 0;
    private responseHandlers: Map<number, (response: any) => void> = new Map();
    private initializationHandlers: Map<number, () => void> = new Map();
    private readonly timeout: number;

    constructor(timeout: number = 2 ** 31 - 1) {
        this.timeout = timeout;
    }

    async createWorkerWithHandlers(workerFile: string): Promise<number> {
        const worker = new Worker(workerFile);
        const workerId = ++this.workerIdCounter;
        this.workers.set(workerId, worker);

        worker.on('message', (message) => {
            this.handleMessage(message, workerId);
        });

        return new Promise<number>((resolve, reject) => {
            this.initializationHandlers.set(workerId, () => {
                clearTimeout(timeoutId);  // Clear timeout on success
                resolve(workerId);
            });

            const timeoutId = setTimeout(() => {
                if (this.initializationHandlers.has(workerId)) {
                    this.initializationHandlers.delete(workerId);
                    reject(new Error('Worker initialization timed out'));
                }
            }, this.timeout);
        });
    }

    private handleMessage(message: any, workerId: number) {
        switch (message.type) {
            case 'initialization':
                const initHandler = this.initializationHandlers.get(workerId);
                if (initHandler) {
                    initHandler();
                    this.initializationHandlers.delete(workerId);
                }
                break;

            case 'response':
                const { requestId, result } = message as ResponseMessage<any>;
                const responseHandler = this.responseHandlers.get(requestId);
                if (responseHandler) {
                    responseHandler(SerDe.deserialize(result));
                    this.responseHandlers.delete(requestId);
                }
                break;

            case 'notification':
                // Handle notifications if necessary
                break;

            default:
                throw new Error(`Unknown message type: ${message.type}`);
        }
    }

    async call<K extends keyof HandlersType>(
        workerId: number,
        methodName: K,
        ...args: Parameters<HandlersType[K]>
    ): Promise<ReturnType<HandlersType[K]>> {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error(`Worker with ID ${workerId} not found`);
        }

        const requestId = ++this.requestIdCounter;
        const request: RequestMessage<{ methodName: K; args: Parameters<HandlersType[K]> }> = {
            type: 'request',
            requestId,
            payload: SerDe.serialise({ methodName, args })
        };

        return new Promise<ReturnType<HandlersType[K]>>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.responseHandlers.delete(requestId);
                reject(new Error('Request timed out'));
            }, this.timeout);

            this.responseHandlers.set(requestId, (result) => {
                clearTimeout(timeoutId);  // Clear timeout on success
                resolve(result);
            });

            worker.postMessage(request);
        });
    }

    sendNotification<K extends keyof HandlersType>(
        workerId: number,
        methodName: K,
        ...args: Parameters<HandlersType[K]>
    ): void {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error(`Worker with ID ${workerId} not found`);
        }

        const notification: NotificationMessage<{ methodName: K; args: Parameters<HandlersType[K]> }> = {
            type: 'notification',
            payload: { methodName, args }
        };

        worker.postMessage(notification);
    }

    async terminateWorker(workerId: number) {
        const worker = this.workers.get(workerId);
        if (worker) {
            await worker.terminate();
            this.workers.delete(workerId);
        }
    }

    registerClasses(classes: Class[]) {
        SerDe.classRegistration(classes)
    }
}
