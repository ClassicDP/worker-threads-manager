"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerManager = void 0;
const worker_threads_1 = require("worker_threads");
class WorkerManager {
    constructor() {
        this.workers = new Map();
        this.nextId = 0;
        this.nextCommandId = 0;
        this.acknowledgementResolves = new Map();
    }
    async createWorker(workerFile) {
        const workerId = this.nextId++;
        const worker = new worker_threads_1.Worker(workerFile);
        // Установка постоянного обработчика сообщений для этого воркера
        worker.on('message', (message) => {
            if (message.type === 'acknowledge') {
                const resolver = this.acknowledgementResolves.get(message.commandId);
                if (resolver) {
                    resolver();
                    this.acknowledgementResolves.delete(message.commandId);
                }
            }
            // Обработка других типов сообщений...
        });
        this.workers.set(workerId, worker);
        // Синхронизация воркера с помощью самоидентификации и установки каналов связи
        await this.sendCommand(workerId, 'selfId');
        await this.setupMessageChannels(workerId);
        return workerId;
    }
    async sendCommand(workerId, type, params) {
        const worker = this.workers.get(workerId);
        if (!worker) {
            throw new Error('Worker not found');
        }
        let command = { type, workerId, commandId: this.getNextCommandId() };
        if (params)
            command = Object.assign(command, params);
        let promise = new Promise((resolve) => {
            this.acknowledgementResolves.set(command.commandId, resolve);
        });
        // Отправляем команду воркеру
        // Регистрируем Promise, чтобы разрешить его, когда придет подтверждение
        const isUpdatePortCommand = (command) => {
            return command.hasOwnProperty('port') && command.port instanceof worker_threads_1.MessagePort;
        };
        worker.postMessage(command, isUpdatePortCommand(command) ? [command.port] : []);
        return promise;
    }
    getNextCommandId() {
        return this.nextCommandId++;
    }
    async terminateWorker(workerId) {
        const worker = this.workers.get(workerId);
        if (worker) {
            // Уведомляем другие воркеры о завершении этого воркера
            await this.notifyWorkersAboutRemoval(workerId);
            await worker.terminate();
            this.workers.delete(workerId);
        }
    }
    async notifyWorkersAboutRemoval(workerId) {
        const notifyPromises = [];
        for (const [id, worker] of this.workers) {
            if (id !== workerId) {
                notifyPromises.push(this.sendCommand(id, 'workerRemoved', { workerId }));
            }
        }
        await Promise.all(notifyPromises);
    }
    async setupMessageChannels(newWorkerId) {
        const ackPromises = [];
        for (const [existingWorkerId, existingWorker] of this.workers) {
            if (existingWorkerId !== newWorkerId) {
                const { port1, port2 } = new worker_threads_1.MessageChannel();
                ackPromises.push(this.sendCommand(existingWorkerId, 'updatePort', {
                    workerId: newWorkerId,
                    port: port2,
                }));
                ackPromises.push(this.sendCommand(newWorkerId, 'updatePort', {
                    workerId: existingWorkerId,
                    port: port1,
                }));
            }
        }
        await Promise.all(ackPromises);
    }
}
exports.WorkerManager = WorkerManager;
//# sourceMappingURL=WorkerManager.js.map