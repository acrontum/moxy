[@acrontum/moxy](../README.md) / Router

# Class: Router

## Table of contents

### Constructors

- [constructor](Router.md#constructor)

### Properties

- [#routerNet](Router.md##routernet)
- [onceRouterPaths](Router.md#oncerouterpaths)
- [options](Router.md#options)
- [routerPaths](Router.md#routerpaths)
- [routes](Router.md#routes)

### Methods

- [#compileRoute](Router.md##compileroute)
- [#createApiRoute](Router.md##createapiroute)
- [#createOrReplaceApiRoute](Router.md##createorreplaceapiroute)
- [#deleteApiRoute](Router.md##deleteapiroute)
- [#isRouterFile](Router.md##isrouterfile)
- [#removeRouteRegex](Router.md##removerouteregex)
- [#sendApiRoot](Router.md##sendapiroot)
- [#sendApiRouter](Router.md##sendapirouter)
- [#sendApiRoutes](Router.md##sendapiroutes)
- [#updateApiRoute](Router.md##updateapiroute)
- [addRoute](Router.md#addroute)
- [addRoutes](Router.md#addroutes)
- [addRoutesFromFolder](Router.md#addroutesfromfolder)
- [getFolderContents](Router.md#getfoldercontents)
- [handleApi](Router.md#handleapi)
- [loadConfigFromFile](Router.md#loadconfigfromfile)
- [removeRoute](Router.md#removeroute)
- [requestListener](Router.md#requestlistener)

## Constructors

### constructor

• **new Router**(`logger`, `options?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `logger` | [`Logger`](Logger.md) |
| `options?` | [`RouterConfig`](../interfaces/RouterConfig.md) |

#### Defined in

[router/router.ts:58](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L58)

## Properties

### #routerNet

• `Private` **#routerNet**: [`RouterNet`](RouterNet.md)

#### Defined in

[router/router.ts:56](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L56)

___

### onceRouterPaths

• **onceRouterPaths**: [`string`, [`ParsedPathConfig`](../README.md#parsedpathconfig)][] = `[]`

Entries of [router path, ParsedPathConfig] for single-use routes

#### Defined in

[router/router.ts:50](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L50)

___

### options

• **options**: [`RouterConfig`](../interfaces/RouterConfig.md)

Router config options

#### Defined in

[router/router.ts:54](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L54)

___

### routerPaths

• **routerPaths**: [`string`, [`ParsedPathConfig`](../README.md#parsedpathconfig)][] = `[]`

Entries of [router path, ParsedPathConfig]

#### Defined in

[router/router.ts:42](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L42)

___

### routes

• **routes**: `Record`<`string`, [`ParsedPathConfig`](../README.md#parsedpathconfig)\> = `{}`

Path-keyed router route config object

#### Defined in

[router/router.ts:46](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L46)

## Methods

### #compileRoute

▸ `Private` **#compileRoute**(`fullPath`, `config`, `options?`): [`ParsedPathConfig`](../README.md#parsedpathconfig)

Adds regex test to route config when options.exact is not true

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fullPath` | `string` | The full path |
| `config` | [`RouteConfig`](../README.md#routeconfig) | The configuration |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Add route options |

#### Returns

[`ParsedPathConfig`](../README.md#parsedpathconfig)

The parsed path configuration

#### Defined in

[router/router.ts:254](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L254)

___

### #createApiRoute

▸ `Private` **#createApiRoute**(`req`, `res`, `path`, `config`): [`MoxyResponse`](MoxyResponse.md)

Creates a route config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |
| `path` | `string` | The path |
| `config` | [`RouteConfig`](../README.md#routeconfig) | The configuration |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:343](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L343)

___

### #createOrReplaceApiRoute

▸ `Private` **#createOrReplaceApiRoute**(`res`, `path`, `body`): [`MoxyResponse`](MoxyResponse.md)

Creates or replaces a route config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The respoonse |
| `path` | `string` | The path |
| `body` | `Record`<`string`, `any`\> | The body |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:381](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L381)

___

### #deleteApiRoute

▸ `Private` **#deleteApiRoute**(`res`, `path`): [`MoxyResponse`](MoxyResponse.md)

Removes a route config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |
| `path` | `string` | The path |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:402](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L402)

___

### #isRouterFile

▸ `Private` **#isRouterFile**(`path`): `boolean`

Determines whether the specified path is router file

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |

#### Returns

`boolean`

#### Defined in

[router/router.ts:276](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L276)

___

### #removeRouteRegex

▸ `Private` **#removeRouteRegex**(`routes`): `string`

Hides parsed regex from response

#### Parameters

| Name | Type |
| :------ | :------ |
| `routes` | [`Routes`](../README.md#routes) |

#### Returns

`string`

#### Defined in

[router/router.ts:416](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L416)

___

### #sendApiRoot

▸ `Private` **#sendApiRoot**(`res`): [`MoxyResponse`](MoxyResponse.md)

Sends an api root response

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:287](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L287)

___

### #sendApiRouter

▸ `Private` **#sendApiRouter**(`req`, `res`): [`MoxyResponse`](MoxyResponse.md)

Sends the current router config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:327](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L327)

___

### #sendApiRoutes

▸ `Private` **#sendApiRoutes**(`req`, `res`): [`MoxyResponse`](MoxyResponse.md)

Sends api router keys

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:313](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L313)

___

### #updateApiRoute

▸ `Private` **#updateApiRoute**(`res`, `path`, `body`): [`MoxyResponse`](MoxyResponse.md)

Updates an existing route config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |
| `path` | `string` | The path |
| `body` | `Record`<`string`, `any`\> | The body |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[router/router.ts:363](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L363)

___

### addRoute

▸ **addRoute**(`path`, `config`, `options?`): [`Router`](Router.md)

Adds a route

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |
| `config` | [`RouteConfig`](../README.md#routeconfig) | The configuration |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Options for the route |

#### Returns

[`Router`](Router.md)

#### Defined in

[router/router.ts:72](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L72)

___

### addRoutes

▸ **addRoutes**(`prefix`, `routes`, `options?`): [`Router`](Router.md)

Adds many routes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prefix` | `string` | The path prefix to prepend to all routes |
| `routes` | [`Routes`](../README.md#routes) | Path suffix keyed RouteConfig |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Options for the routes |

#### Returns

[`Router`](Router.md)

#### Defined in

[router/router.ts:103](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L103)

___

### addRoutesFromFolder

▸ **addRoutesFromFolder**(`path`): `Promise`<[`Router`](Router.md)\>

Recursively search the folder at <path> for files matching <anything>.routes.js(on) and import their config

#### Parameters

| Name | Type |
| :------ | :------ |
| `path` | `string` |

#### Returns

`Promise`<[`Router`](Router.md)\>

#### Defined in

[router/router.ts:130](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L130)

___

### getFolderContents

▸ **getFolderContents**(`dirPath`): `Promise`<`Dirent`[]\>

Gets the folder contents

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `dirPath` | `string` | The dir path |

#### Returns

`Promise`<`Dirent`[]\>

{Promise<fsDirent[]>

#### Defined in

[router/router.ts:158](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L158)

___

### handleApi

▸ **handleApi**(`req`, `res`): `Promise`<[`MoxyResponse`](MoxyResponse.md)\>

Handle requests to api routes (/_moxy)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |

#### Returns

`Promise`<[`MoxyResponse`](MoxyResponse.md)\>

#### Defined in

[router/router.ts:207](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L207)

___

### loadConfigFromFile

▸ **loadConfigFromFile**(`filePath`, `basePath`): `void`

Loads a configuration from file

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filePath` | `string` | The file path |
| `basePath` | `string` | The base path |

#### Returns

`void`

#### Defined in

[router/router.ts:174](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L174)

___

### removeRoute

▸ **removeRoute**(`path`): [`Router`](Router.md)

Removes a route

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |

#### Returns

[`Router`](Router.md)

#### Defined in

[router/router.ts:116](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L116)

___

### requestListener

▸ **requestListener**(`req`, `res`): `Promise`<`any`\>

Server request listener

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The resource |

#### Returns

`Promise`<`any`\>

#### Defined in

[router/router.ts:195](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router.ts#L195)
