import {WorkerManager} from "../src";
import {Matrix, WorkerHandlers} from "./worker";
import {resolve} from "path";
(async ()=> {
    let manager = new WorkerManager<WorkerHandlers>()
    let workerId1 = await manager.createWorkerWithHandlers(resolve(__dirname, 'worker.js'));
    let res1 = await manager.call(workerId1, 'processData', '123')
    let workerId2 = await manager.createWorkerWithHandlers(resolve(__dirname, 'worker.js'));
    let res2 = await manager.call(workerId2, 'calculateSum', 1, 2)
    manager.registerClasses([Matrix])
    let m = await manager.call(workerId1, 'matrixOperations', new Matrix(2), new Matrix(3))
    console.log(res1, res2, m)
    await manager.terminateWorker(workerId1)
    await manager.terminateWorker(workerId2)
})().then(()=>console.log('finish'))
