import { HoneyFlowClient } from '../client';
import { TrackOperationOptions } from '../interfaces/track-operation-options.interface';

export function TrackOperation(name?: string, options?: TrackOperationOptions): MethodDecorator;
export function TrackOperation(options?: TrackOperationOptions): MethodDecorator;
export function TrackOperation(nameOrOptions?: string | TrackOperationOptions, options = {} as TrackOperationOptions) {
    // set name and options based off of arguments
    let name: string;
    if (nameOrOptions) {
        if (typeof nameOrOptions === 'string') {
            name = nameOrOptions;
        } else {
            options = nameOrOptions;
        }
    }

    // set sample rate based off of local options or default to app setting
    const sampleRate = options.sampleRate || HoneyFlowClient.sampleRate;

    const send = (startedAt: Date, success: boolean) => {
        const endedAt = new Date();

        HoneyFlowClient.send({
            type: 'OPERATION',
            name,
            responseStatusCode: success ? 1 : 0,
            startedAt,
            endedAt,
            duration: endedAt.getTime() - startedAt.getTime()
        });
    };

    // return function decorator
    return (target: any, key: any, descriptor: any) => {
        // if no name passed in, set default
        name = name || `${target.constructor.name}.${key.toString()}`;

        // store original method
        const originalMethod = descriptor.value;

        // run as async by default
        if (!options.isSynchronous) {
            descriptor.value = async function (...args: any[]) {
                // determine to track based off of sample rate, if not just run function
                if (Math.random() > sampleRate) {
                    return await originalMethod.apply(this, args);
                }

                const startedAt = new Date();

                try {
                    // run original method
                    const result = await originalMethod.apply(this, args);

                    // send request
                    send(startedAt, true);

                    // return result of function
                    return result;
                }
                catch (error) {
                    // send request
                    send(startedAt, false);

                    // throw the error
                    throw error;
                }
            };
        }
        // run as sync if isSynchronous: true
        else {
            descriptor.value = function (...args: any[]) {
                // determine to track based off of sample rate, if not just run function
                if (Math.random() > sampleRate) {
                    return originalMethod.apply(this, args);
                }

                const startedAt = new Date();

                try {
                    // run original method
                    const result = originalMethod.apply(this, args);

                    // send request
                    send(startedAt, true);

                    // return result of function
                    return result;
                }
                catch (error) {
                    // send request
                    send(startedAt, false);

                    // throw the error
                    throw error;
                }
            };
        }
    }
}
