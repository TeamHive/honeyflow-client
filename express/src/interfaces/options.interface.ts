export interface HoneyFlowOptions {
    apiKey: string;
    host?: string;
    release?: string;
    environment?: string;
    sampleRate?: number;
    ignoreEndpoints?: (string | RegExp)[];
    ignoreHeaders?: (string | RegExp)[];
    sanitizeKeys?: (string | RegExp)[]; // for request body
    ignoreHttpResponseStatuses?: number[];
    customErrorHandler?: (error) => void;
    shouldSendCallback?: Function; // be more specific of what it takes
}

// whiteListEndpoints
// ignoreEndpoints

// whiteListHeaders
// ignoreHeaders

// sampleRate - 0 to 1 value representing what percentage of requests to actually send?
    // interesting for a larger application that would use this, maybe would not want request sent each time?
    // per endpoint... or maybe even

// shouldSendCallback - custom function to determine if a request should be sent to API

// sanitizeKeys - an array of strings or regex values to eliminate sending from request body

// think about certain properties that we will send and if any of those would be optional to send or
// if any of them would need to be limited or have a filter
