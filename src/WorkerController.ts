import { parentPort } from 'worker_threads';
import {Class, SerDe} from "serde-ts";

export class WorkerController {
  private static handlers: any;

  static initialize(handlers: any) {
    this.handlers = handlers;

    // Send initialization acknowledgment when the worker is fully ready
    const initAck = { type: 'initialization' };
    if (parentPort) {
      parentPort.postMessage(initAck);
    }

    if (parentPort) {
      parentPort.on('message', (event) => {
        this.handleMessage(event);
      });
    }
  }

  private static handleMessage(message: any) {
    switch (message.type) {
      case 'request':
        this.handleRequest(message);
        break;
      case 'notification':
        this.handleNotification(message);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  private static handleRequest(message: any) {
    const { requestId, payload } = message;
    const { methodName, args } = SerDe.deserialize(payload);

    if (this.handlers && typeof this.handlers[methodName] === 'function') {
      try {
        const result = SerDe.serialise(this.handlers[methodName](...args));
        const response = { type: 'response', requestId, result };
        if (parentPort) {
          parentPort.postMessage(response);
        }
      } catch (error) {
        const response = { type: 'response', requestId, result: error };
        if (parentPort) {
          parentPort.postMessage(response);
        }
      }
    } else {
      const response = {
        type: 'response',
        requestId,
        result: new Error(`Method ${methodName} not found on handlers`)
      };
      if (parentPort) {
        parentPort.postMessage(response);
      }
    }
  }

  private static handleNotification(message: any) {
    const { methodName, args } = message.payload;

    if (this.handlers && typeof this.handlers[methodName] === 'function') {
      try {
        this.handlers[methodName](...args);
      } catch (error) {
        if (error instanceof Error) {
          console.error(`Error handling notification: ${error.message}`);
        } else {
          console.error('Error handling notification: unknown error');
        }
      }
    } else {
      console.warn(`Notification method ${methodName} not found on handlers`);
    }
  }

  static registerClasses(classes: Class[]) {
    SerDe.classRegistration(classes)
  }
}
