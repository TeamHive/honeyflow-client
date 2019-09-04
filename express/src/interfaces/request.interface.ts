import { TrackingInstanceType } from "./tracking-instance.type";

export interface HoneyFlowRequest {
    type: TrackingInstanceType;
    startedAt: Date;
    endedAt: Date;
    duration: number;
    name?: string;
    userAgent?: string;
    requestMethod?: string;
    requestRoute?: string;
    requestHeaders?: any;
    requestBody?: any;
    responseStatusCode: number;
    environment?: string;
    release?: string;
}
