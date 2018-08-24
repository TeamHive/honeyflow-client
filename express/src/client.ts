import * as request from 'request-promise-native';

import {
    HoneyFlowOptions,
    ExpressMiddleware,
    HoneyFlowResponseTimer,
    HoneyFlowRequest
} from './interfaces';


const DEFAULT_HOST = 'https://honeyflow.teamhive.com';
const DEFAULT_IGNORED_STATUSES = [401, 403, 405];
const API_ENDPOINTS = {
    TRACKING: '/api/v1/tracking'
};


export class HoneyFlowClient {
    apiBaseURL: string;
    errorHandler: (error) => void;

    apiKey: string;
    release: string;
    environment: string;
    sampleRate: number;
    ignoreEndpoints: (string | RegExp)[];
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
        this.sampleRate = options.sampleRate;
        this.ignoreEndpoints = options.ignoreEndpoints;
        this.ignoreHeaders = options.ignoreHeaders;
        this.shouldSendCallback = options.shouldSendCallback;
    }

    monitor(): ExpressMiddleware {
        return (req: any, res: any, next: any): void => {
            // check if this request is to an endpoint that we want to collect data on...

            const startedAt = new Date();
            res.once('finish', async () => {
                const endedAt = new Date();
                const duration = endedAt.getTime() - startedAt.getTime();

                // was this a successful request - if error even send?
                if (this.isValidStatusCode(res.statusCode)) {
                    await this.send(req, res.statusCode, {
                        startedAt,
                        endedAt,
                        duration
                    });
                }
            });
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

        // filter req headers
        const requestHeaders = this.filterRequestHeaders(req.headers);

        // filter req body
        const requestBody = this.filterRequestBody(req.body);

        // create an object to send to send to API - EndpointMonitorRequest
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

        // send request to api
        try {
            await request.post(requestOptions);
        }
        catch (error) {
            this.errorHandler(error);
        }
    }

    private filterRequestHeaders(headers: any): any {
        const filteredHeaders = { ...headers };
        // change value of authorization (loop through if we have list of ones to always filter)
        filteredHeaders['Authorization'] ? filteredHeaders['Authorization'] = '[Filtered]' : null;
        filteredHeaders['authorization'] ? filteredHeaders['authorization'] = '[Filtered]' : null;

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

    private defaultErrorHandler(error): void {
        console.log(`Error with request to Honeyflow: ${JSON.stringify(error.error)}`);
    }
}
