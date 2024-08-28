"use strict";
// Define handler functions for the worker
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerHandlers = exports.Matrix = void 0;
const src_1 = require("../src");
class Matrix {
    constructor(x) {
        this.a = x;
    }
    addMatrix(m) {
        this.a += m.a;
        return this;
    }
}
exports.Matrix = Matrix;
class WorkerHandlers {
    processData(data) {
        return `Processed: ${data}`;
    }
    calculateSum(a, b) {
        return a + b;
    }
    matrixOperations(m1, m2) {
        return m1.addMatrix(m2);
    }
}
exports.WorkerHandlers = WorkerHandlers;
src_1.WorkerController.initialize(new WorkerHandlers());
src_1.WorkerController.registerClasses([Matrix]);
//# sourceMappingURL=worker.js.map