

// Define handler functions for the worker

import {WorkerController} from "../src";
import {Handlers} from "../src/interfaces";
export class Matrix {
    a: number
    constructor (x: number) {
        this.a = x
    }
    addMatrix(m: Matrix) {
        this.a += m.a
        return this
    }
}
export class WorkerHandlers implements Handlers {
    processData(data: string): string {
        return `Processed: ${data}`;
    }

    calculateSum(a: number, b: number): number {
        return a + b;
    }

    matrixOperations(m1: Matrix, m2: Matrix) {
        return m1.addMatrix(m2)
    }

}

WorkerController.initialize(new WorkerHandlers())
WorkerController.registerClasses([Matrix])

