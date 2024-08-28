"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const serde_ts_1 = require("serde-ts");
let x = serde_ts_1.SerDe.serialise({ method: "123", arg: [1, 2, 3, 4] });
let y = serde_ts_1.SerDe.deserialize(x);
console.log(y, x);
//# sourceMappingURL=test.js.map