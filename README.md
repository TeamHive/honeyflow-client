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
app.use(new HoneyFlowClient({
    apiKey: 'APIKEY'
}).monitor());

... The rest of your express logic
```

