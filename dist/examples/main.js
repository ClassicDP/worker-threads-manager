"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
const worker_1 = require("./worker");
const path_1 = require("path");
(async () => {
    let manager = new src_1.WorkerManager();
    let workerId1 = await manager.createWorkerWithHandlers((0, path_1.resolve)(__dirname, 'worker.js'));
    let res1 = await manager.call(workerId1, 'processData', '123');
    let workerId2 = await manager.createWorkerWithHandlers((0, path_1.resolve)(__dirname, 'worker.js'));
    let res2 = await manager.call(workerId2, 'calculateSum', 1, 2);
    manager.registerClasses([worker_1.Matrix]);
    let m = await manager.call(workerId1, 'matrixOperations', new worker_1.Matrix(2), new worker_1.Matrix(3));
    console.log(res1, res2, m);
    await manager.terminateWorker(workerId1);
    await manager.terminateWorker(workerId2);
})().then(() => console.log('finish'));
//# sourceMappingURL=main.js.map