@acrontum/moxy

# @acrontum/moxy

## Table of contents

### Classes

- [Logger](classes/Logger.md)
- [MoxyRequest](classes/MoxyRequest.md)
- [MoxyResponse](classes/MoxyResponse.md)
- [MoxyServer](classes/MoxyServer.md)
- [Router](classes/Router.md)
- [RouterNet](classes/RouterNet.md)

### Interfaces

- [AddRouteOptions](interfaces/AddRouteOptions.md)
- [CloseServerOptions](interfaces/CloseServerOptions.md)
- [MethodSettings](interfaces/MethodSettings.md)
- [PathConfigWithOptions](interfaces/PathConfigWithOptions.md)
- [PathSettings](interfaces/PathSettings.md)
- [RouterConfig](interfaces/RouterConfig.md)
- [SendOptions](interfaces/SendOptions.md)
- [ServerConfig](interfaces/ServerConfig.md)

### Type aliases

- [HandlerVariables](README.md#handlervariables)
- [LogLevels](README.md#loglevels)
- [Method](README.md#method)
- [MethodConfig](README.md#methodconfig)
- [ParsedPathConfig](README.md#parsedpathconfig)
- [PathConfig](README.md#pathconfig)
- [RequestHandler](README.md#requesthandler)
- [RouteConfig](README.md#routeconfig)
- [Routes](README.md#routes)

### Variables

- [colours](README.md#colours)
- [methodColours](README.md#methodcolours)

### Functions

- [formatBody](README.md#formatbody)
- [formatMethod](README.md#formatmethod)
- [formatRouteResponse](README.md#formatrouteresponse)
- [formatRoutesForPrinting](README.md#formatroutesforprinting)
- [formatStatus](README.md#formatstatus)
- [getOption](README.md#getoption)
- [main](README.md#main)

## Type aliases

### HandlerVariables

Ƭ **HandlerVariables**: `Record`<`string`, `string` \| `string`[]\>

Path and query params

#### Defined in

[router/index.ts:8](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L8)

___

### LogLevels

Ƭ **LogLevels**: ``"error"`` \| ``"off"`` \| `string`

#### Defined in

[util/logger.ts:1](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L1)

___

### Method

Ƭ **Method**: ``"connect"`` \| ``"delete"`` \| ``"get"`` \| ``"head"`` \| ``"options"`` \| ``"patch"`` \| ``"post"`` \| ``"put"`` \| ``"trace"``

Common http verbs

#### Defined in

[router/index.ts:13](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L13)

___

### MethodConfig

Ƭ **MethodConfig**: [`MethodSettings`](interfaces/MethodSettings.md) \| `string` \| [`RequestHandler`](README.md#requesthandler)

Configuration for a method.
Would be configured as { get: MethodConfig, post: MethodConfig, ... }

examples

Standard http response:
  {
    status: 200,
    body: { message: 'hello' },
  }

Manual request listener method:
  async (req, res, vars) => res.sendJson({ url: req.url, date: Date.now() }, { status: 201 });

Static file:
  '/static/:file'

#### Defined in

[router/index.ts:77](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L77)

___

### ParsedPathConfig

Ƭ **ParsedPathConfig**: [`RouteConfig`](README.md#routeconfig) & [`PathConfigWithOptions`](interfaces/PathConfigWithOptions.md)

#### Defined in

[router/router.ts:36](https://github.com/acrontum/moxy/blob/527f192/src/router/router.ts#L36)

___

### PathConfig

Ƭ **PathConfig**: [`PathSettings`](interfaces/PathSettings.md) & { `all?`: [`MethodConfig`](README.md#methodconfig)  } & { [key in Method]?: MethodConfig }

Configuration for a path.

#### Defined in

[router/index.ts:82](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L82)

___

### RequestHandler

Ƭ **RequestHandler**: (`req`: [`MoxyRequest`](classes/MoxyRequest.md), `res`: [`MoxyResponse`](classes/MoxyResponse.md), `variables`: [`HandlerVariables`](README.md#handlervariables)) => `void`

#### Type declaration

▸ (`req`, `res`, `variables`): `void`

Manual request handler

##### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`MoxyRequest`](classes/MoxyRequest.md) |
| `res` | [`MoxyResponse`](classes/MoxyResponse.md) |
| `variables` | [`HandlerVariables`](README.md#handlervariables) |

##### Returns

`void`

#### Defined in

[router/index.ts:18](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L18)

___

### RouteConfig

Ƭ **RouteConfig**: [`RequestHandler`](README.md#requesthandler) \| [`PathConfig`](README.md#pathconfig)

Configuration for a route.

#### Defined in

[router/index.ts:87](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L87)

___

### Routes

Ƭ **Routes**: `Record`<`string`, [`RouteConfig`](README.md#routeconfig)\>

Configuration for multiple routes.

#### Defined in

[router/index.ts:92](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L92)

## Variables

### colours

• `Const` **colours**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `blue` | `string` |
| `green` | `string` |
| `majenta` | `string` |
| `none` | `string` |
| `purple` | `string` |
| `red` | `string` |
| `teal` | `string` |
| `yellow` | `string` |

#### Defined in

[util/format.ts:3](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L3)

___

### methodColours

• `Const` **methodColours**: `Record`<[`Method`](README.md#method), `string`\>

#### Defined in

[util/format.ts:14](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L14)

## Functions

### formatBody

▸ **formatBody**(`body`): `string` \| `Buffer`

#### Parameters

| Name | Type |
| :------ | :------ |
| `body` | `string` \| `Record`<`string`, `any`\> \| `Buffer` |

#### Returns

`string` \| `Buffer`

#### Defined in

[util/format.ts:48](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L48)

___

### formatMethod

▸ **formatMethod**(`method`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | [`Method`](README.md#method) |

#### Returns

`string`

#### Defined in

[util/format.ts:26](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L26)

___

### formatRouteResponse

▸ **formatRouteResponse**(`req`, `res`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`MoxyRequest`](classes/MoxyRequest.md) |
| `res` | [`MoxyResponse`](classes/MoxyResponse.md) |

#### Returns

`string`

#### Defined in

[util/format.ts:60](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L60)

___

### formatRoutesForPrinting

▸ **formatRoutesForPrinting**(`routes`, `expandFunction?`): `string`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `routes` | [`Routes`](README.md#routes) | `undefined` |
| `expandFunction` | `boolean` | `true` |

#### Returns

`string`

#### Defined in

[util/format.ts:70](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L70)

___

### formatStatus

▸ **formatStatus**(`status`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `status` | `number` |

#### Returns

`string`

#### Defined in

[util/format.ts:29](https://github.com/acrontum/moxy/blob/527f192/src/util/format.ts#L29)

___

### getOption

▸ **getOption**(`argv?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `argv?` | `string`[] |

#### Returns

`number`

#### Defined in

[cli.ts:23](https://github.com/acrontum/moxy/blob/527f192/src/cli.ts#L23)

___

### main

▸ **main**(`argv?`): `Promise`<[`MoxyServer`](classes/MoxyServer.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `argv?` | `string`[] |

#### Returns

`Promise`<[`MoxyServer`](classes/MoxyServer.md)\>

#### Defined in

[cli.ts:70](https://github.com/acrontum/moxy/blob/527f192/src/cli.ts#L70)
