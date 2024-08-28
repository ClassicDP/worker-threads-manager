"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerController = void 0;
const worker_threads_1 = require("worker_threads");
const serde_ts_1 = require("serde-ts");
class WorkerController {
    constructor(handlers, usingSerialisation = true) {
        this.ports = new Map();
        this.responseHandlers = new Map();
        this.handlers = handlers;
        this.usingSerialisation = usingSerialisation;
        this.boundHandleIncomingMessage = this.handleIncomingMessage.bind(this);
        if (worker_threads_1.parentPort) {
            worker_threads_1.parentPort.on('message', this.boundHandleIncomingMessage);
        }
    }
    static getNextMessageId() {
        return ++this.messageId;
    }
    getWorkersId() {
        return [...this.ports.entries()].map((x) => x[0]);
    }
    async call(workerId, classType, methodName, ...args) {
        const messageId = WorkerController.getNextMessageId();
        const port = this.ports.get(workerId);
        if (!port) {
            return Promise.reject(new Error('Port not found for worker ' + workerId));
        }
        return new Promise((resolve, reject) => {
            // Регистрация обработчика ответа
            const responseHandler = (response) => {
                if (response.messageId === messageId) {
                    // Десериализация результата, если это необходимо
                    const result = this.usingSerialisation && response.result !== undefined
                        ? serde_ts_1.SerDe.deserialize(JSON.parse(response.result))
                        : response.result;
                    resolve(result);
                    this.responseHandlers.delete(messageId); // Удаление обработчика после его вызова
                }
            };
            this.responseHandlers.set(messageId, responseHandler);
            // Отправка запроса
            const request = {
                type: 'functionCallRequest',
                messageId,
                functionName: methodName,
                args: this.usingSerialisation ? args.map((x) => serde_ts_1.SerDe.serialise(x)) : args,
            };
            port.postMessage(request);
        });
    }
    id() {
        var _a;
        return ((_a = this.selfId) !== null && _a !== void 0 ? _a : -1).toString();
    }
    async handleIncomingMessage(message) {
        if (message.type === 'updatePort') {
            const updatePortMessage = message;
            this.handleUpdatePort(updatePortMessage.workerId, updatePortMessage.port);
            this.acknowledge(message.commandId);
        }
        else if (message.type === 'run' && this.handlers) {
            await this.handlers['run']();
            this.acknowledge(message.commandId);
        }
        else if (message.type === 'selfId') {
            this.selfId = message.workerId;
            this.acknowledge(message.commandId);
        }
    }
    acknowledge(commandId) {
        worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ type: 'acknowledge', workerId: this.selfId, commandId });
    }
    handleUpdatePort(workerId, port) {
        this.ports.set(workerId, port);
        port.on('message', this.handleIncomingMessageFromPort.bind(this, workerId));
    }
    async handleIncomingMessageFromPort(workerId, message) {
        var _a;
        if (message.type === 'functionCallRequest') {
            const functionCallRequest = message;
            const handler = this.handlers ?
                this.handlers[functionCallRequest.functionName] : undefined;
            if (handler) {
                let args = this.usingSerialisation
                    ? functionCallRequest.args.map((x) => serde_ts_1.SerDe.deserialize(x))
                    : functionCallRequest.args;
                const result = await handler(...args);
                console.time('serialise');
                let toSend = this.usingSerialisation ? JSON.stringify(serde_ts_1.SerDe.serialise(result)) : result;
                console.timeEnd('serialise');
                (_a = this.ports.get(workerId)) === null || _a === void 0 ? void 0 : _a.postMessage({
                    type: 'functionCallResponse',
                    messageId: functionCallRequest.messageId,
                    result: toSend,
                    timeStamp: Date.now(),
                });
            }
        }
        if (message.type === 'functionCallResponse') {
            const functionCallResponse = message;
            const handler = this.responseHandlers.get(functionCallResponse.messageId);
            if (handler) {
                handler(functionCallResponse);
                // После вызова обработчика, его можно удалить
                this.responseHandlers.delete(functionCallResponse.messageId);
            }
        }
    }
}
exports.WorkerController = WorkerController;
WorkerController.messageId = 0;
//# sourceMappingURL=WorkerController.js.map