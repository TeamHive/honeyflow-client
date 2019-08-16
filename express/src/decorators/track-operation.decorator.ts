import { HoneyFlowClient } from "../client";

export function TrackOperation(name: string) {

    return (_target: any, _key: any, descriptor: any) => {
        // store original method
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const startedAt = new Date();

            try {
                // run original method
                const result = await originalMethod.apply(this, args);

                const endedAt = new Date();

                // send request
                HoneyFlowClient.send({
                    type: 'OPERATION',
                    name,
                    responseStatusCode: 1, // success
                    startedAt,
                    endedAt,
                    duration: endedAt.getTime() - startedAt.getTime()
                });

                // return result of function
                return result;
            }
            catch (error) {
                const endedAt = new Date();

                // send request
                HoneyFlowClient.send({
                    type: 'OPERATION',
                    name,
                    responseStatusCode: 0, // failure
                    startedAt,
                    endedAt,
                    duration: endedAt.getTime() - startedAt.getTime()
                });

                // throw the error
                throw error;
            }
        };
    }
}
