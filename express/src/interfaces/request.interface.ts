export interface HoneyFlowRequest {
    startedAt: Date;
    endedAt: Date;
    duration: number;
    release: string;
    environment: string;
    userAgent: string;
    requestMethod: string;
    requestRoute: string;
    requestHeaders: any;
    requestBody: any;
    responseStatusCode: number;
}
