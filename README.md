# HoneyFlow-Client

Currently Supported client connectors:
- Express




### Express Install
All you need to do is npm install the pack and then run the middleware. Make sure you setup the middleware before any of your routes are defined.

```npm i @teamhive/honeyflow-express-client```

```
import * as express from 'express';
import { HoneyFlowClient } from '@teamhive/honeyflow-express-client';

const app: express.Express = express();
HoneyFlowClient.config({
    apiKey: 'APIKEY'
});
app.use(HoneyFlowClient.monitorEndpoints());

... The rest of your express logic
```

### Options
**ignoreEndpoints**: Takes an array of route strings, IgnoreEndpointItems, or a combination.
```
// route string
['/users', '/users/:identity']

// IgnoreEndpointItem, to specify methods to ignore for the given route
[{
    route: '/users/:identity',
    methods: ['GET', 'PUT']
}]
```

### Track Operations Decorator
If you want to track operation time and success of non-endpoint functions in your application you can use the `TrackOperation` decorator and simply pass in the name you want to register the operation as. By default this assumes the function you are decorating is async. If you are decorating a synchrous function pass that into the options parameter.

```
// fetch in the user service
@TrackOperation('UserService.fetch')
async fetch(identity: string) {
    return await this.userRepository.findOne({ where: identity });
}

// if sync, use options
@TrackOperation('SyncService.compare', { isSynchronous: true })
compare(obj1: any, obj2: any) {
    ...
}
```