import { HttpMethod } from "./http-method.type";

export interface IgnoreEndpointsItem {
    route: string;
    methods: HttpMethod[];
}
