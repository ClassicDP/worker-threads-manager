"use strict";
// Define handler functions for the worker
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerHandlers = void 0;
const src_1 = require("../src");
class WorkerHandlers {
    async processData(data) {
        return `Processed: ${data}`;
    }
    async calculateSum(a, b) {
        return a + b;
    }
}
exports.WorkerHandlers = WorkerHandlers;
src_1.WorkerController.initialize(new WorkerHandlers());
//# sourceMappingURL=worker.js.map