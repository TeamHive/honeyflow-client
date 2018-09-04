import * as request from 'request-promise-native';

import {
    HoneyFlowOptions,
    ExpressMiddleware,
    HoneyFlowResponseTimer,
    HoneyFlowRequest,
    IgnoreEndpointsItem,
    HttpMethod
} from './interfaces';


const DEFAULT_HOST = 'https://honeyflow.teamhive.com';
const DEFAULT_IGNORED_STATUSES = [401, 403, 405];
const API_ENDPOINTS = {
    TRACKING: '/api/v1/tracking'
};
const AUTO_FILTERED_HEADERS = ['Authorization', 'authorization', 'Cookie', 'cookie', 'Cookie2', 'cookie2'];


export class HoneyFlowClient {
    apiBaseURL: string;
    errorHandler: (error) => void;

    apiKey: string;
    release: string;
    environment: string;
    sampleRate: number;
    ignoreEndpoints: (string | IgnoreEndpointsItem)[];
    ignoreHeaders: (string | RegExp)[];
    sanitizeKeys: (string | RegExp)[];
    ignoreHttpResponseStatuses: number[];
    customErrorHandler: (error) => void;
    shouldSendCallback: Function;

    constructor(options: HoneyFlowOptions) {
        // defaults
        this.ignoreHttpResponseStatuses = options.ignoreHttpResponseStatuses || DEFAULT_IGNORED_STATUSES;
        this.errorHandler = options.customErrorHandler || this.defaultErrorHandler;

        this.apiBaseURL = options.host || DEFAULT_HOST;

        this.apiKey = options.apiKey;
        this.release = options.release;
        this.environment = options.environment;
        this.sampleRate = (options.sampleRate > 0 && options.sampleRate < 1) ? options.sampleRate : 1;
        this.ignoreEndpoints = options.ignoreEndpoints || [];
        this.ignoreHeaders = options.ignoreHeaders || [];
        this.shouldSendCallback = options.shouldSendCallback;
    }

    monitor(): ExpressMiddleware {
        return (req: any, res: any, next: any): void => {
            if (this.isValidEndpoint(req) && Math.random() < this.sampleRate) {
                const startedAt = new Date();
                res.once('finish', async () => {
                    const endedAt = new Date();
                    const duration = endedAt.getTime() - startedAt.getTime();

                    if (this.isValidStatusCode(res.statusCode)) {
                        await this.send(req, res.statusCode, {
                            startedAt,
                            endedAt,
                            duration
                        });
                    }
                });
            }
            next();
        };
    }

    private async send(
        req: any,
        responseStatusCode: number,
        responseTimer: HoneyFlowResponseTimer
    ): Promise<void> {
        const userAgent = req.headers ? req.headers['user-agent'] : undefined;
        const requestRoute = this.getRoute(req);
        const requestHeaders = this.filterRequestHeaders(req.headers);
        const requestBody = this.filterRequestBody(req.body);

        const requestOptions: request.OptionsWithUrl = {
            method: 'POST',
            url: `${this.apiBaseURL}${API_ENDPOINTS.TRACKING}`,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: {
                ...responseTimer,
                release: this.release,
                environment: this.environment,
                userAgent,
                requestMethod: req.method,
                requestRoute,
                requestHeaders,
                requestBody,
                responseStatusCode
            } as HoneyFlowRequest,
            json: true
        };

        try {
            await request.post(requestOptions);
        }
        catch (error) {
            this.errorHandler(error);
        }
    }

    private filterRequestHeaders(headers: any): any {
        const filteredHeaders = { ...headers };

        // loop through auto filtered headers and filter if they exist
        for (const header of AUTO_FILTERED_HEADERS) {
            filteredHeaders[header] ? filteredHeaders[header] = '[Filtered]' : null;
        }

        // check ignoreHeaders
        // loop throughbignore headers, if regex then

        return filteredHeaders;
    }

    private filterRequestBody(body: any): any {
        const filteredBody = { ...body };

        // filter password
        filteredBody.password ? filteredBody.password = '[Filtered]' : null;

        // check sanitizeKeys and delete anything that matches

        return filteredBody;
    }

    private getRoute(req: any): string {
        return (req.route && req.route.path) ? req.route.path : req.path;
    }

    private isValidStatusCode(statusCode: number): boolean {
        return this.ignoreHttpResponseStatuses.indexOf(statusCode) === -1;
    }

    private isValidEndpoint(req: any): boolean {
        const endpointMethod: HttpMethod = req.method;
        const endpointRoute = this.getRoute(req);

        for (const item of this.ignoreEndpoints) {
            // if string, check if incoming route includes it
            if (typeof item === 'string') {
                if (endpointRoute.indexOf(item) !== -1) {
                    return false;
                }
            }
            else {
                // if object, check route and also that the method matches
                if (endpointRoute.indexOf(item.route) !== -1 && item.methods.some(method => method === endpointMethod)) {
                    return false;
                }
            }
        }

        return true;
    }

    private defaultErrorHandler(error): void {
        console.log(`Error with request to Honeyflow: ${JSON.stringify(error.error)}`);
    }
}
