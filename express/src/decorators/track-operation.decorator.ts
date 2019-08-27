import { HoneyFlowClient } from '../client';
import { TrackOperationOptions } from '../interfaces/track-operation-options.interface';

export function TrackOperation(name: string, options = {} as TrackOperationOptions) {

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
    return (_target: any, _key: any, descriptor: any) => {
        // store original method
        const originalMethod = descriptor.value;

        // run as async by default
        if (!options.isSynchronous) {
            descriptor.value = async function (...args: any[]) {
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
