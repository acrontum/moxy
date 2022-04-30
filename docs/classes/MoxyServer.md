[@acrontum/moxy](../README.md) / MoxyServer

# Class: MoxyServer

## Table of contents

### Constructors

- [constructor](MoxyServer.md#constructor)

### Properties

- [#currentResponse](MoxyServer.md##currentresponse)
- [#logger](MoxyServer.md##logger)
- [router](MoxyServer.md#router)
- [server](MoxyServer.md#server)

### Accessors

- [logLevel](MoxyServer.md#loglevel)
- [port](MoxyServer.md#port)

### Methods

- [#createConnectionManager](MoxyServer.md##createconnectionmanager)
- [#handleUncaughtErrors](MoxyServer.md##handleuncaughterrors)
- [close](MoxyServer.md#close)
- [listen](MoxyServer.md#listen)
- [off](MoxyServer.md#off)
- [on](MoxyServer.md#on)
- [onAll](MoxyServer.md#onall)
- [once](MoxyServer.md#once)
- [resetRoutes](MoxyServer.md#resetroutes)

## Constructors

### constructor

• **new MoxyServer**(`config?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `config?` | [`ServerConfig`](../interfaces/ServerConfig.md) |

#### Defined in

[server/moxy-server.ts:47](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L47)

## Properties

### #currentResponse

• `Private` **#currentResponse**: [`MoxyResponse`](MoxyResponse.md)

#### Defined in

[server/moxy-server.ts:44](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L44)

___

### #logger

• `Private` **#logger**: [`Logger`](Logger.md)

#### Defined in

[server/moxy-server.ts:45](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L45)

___

### router

• **router**: [`Router`](Router.md)

The internal router

#### Defined in

[server/moxy-server.ts:42](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L42)

___

### server

• `Optional` **server**: `Server`

Instance of HTTP server

#### Defined in

[server/moxy-server.ts:38](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L38)

## Accessors

### logLevel

• `get` **logLevel**(): `string`

Get current log level

#### Returns

`string`

#### Defined in

[server/moxy-server.ts:64](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L64)

• `set` **logLevel**(`value`): `void`

Set current log level

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `string` |

#### Returns

`void`

#### Defined in

[server/moxy-server.ts:71](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L71)

___

### port

• `get` **port**(): `number`

The listening server port

#### Returns

`number`

#### Defined in

[server/moxy-server.ts:57](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L57)

## Methods

### #createConnectionManager

▸ `Private` **#createConnectionManager**(): `void`

Configures connection management

#### Returns

`void`

#### Defined in

[server/moxy-server.ts:221](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L221)

___

### #handleUncaughtErrors

▸ `Private` **#handleUncaughtErrors**(`error`): `void`

Configures logging errors and returning 500

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `error` | `Error` | The error |

#### Returns

`void`

#### Defined in

[server/moxy-server.ts:209](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L209)

___

### close

▸ **close**(`options?`): `Promise`<`void`\>

Close the HTTP server

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `options?` | [`CloseServerOptions`](../interfaces/CloseServerOptions.md) | Close server options |

#### Returns

`Promise`<`void`\>

#### Defined in

[server/moxy-server.ts:190](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L190)

___

### listen

▸ **listen**(`port?`): `Promise`<`Server`\>

Start the HTTP server

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `port` | `number` | `0` |

#### Returns

`Promise`<`Server`\>

#### Defined in

[server/moxy-server.ts:153](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L153)

___

### off

▸ **off**(`path`): [`MoxyServer`](MoxyServer.md)

Remove path handler

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |

#### Returns

[`MoxyServer`](MoxyServer.md)

#### Defined in

[server/moxy-server.ts:112](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L112)

___

### on

▸ **on**(`path`, `config`, `options?`): [`MoxyServer`](MoxyServer.md)

Add path config handler

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |
| `config` | [`RouteConfig`](../README.md#routeconfig) | The route handler config |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Extra router options |

#### Returns

[`MoxyServer`](MoxyServer.md)

#### Defined in

[server/moxy-server.ts:84](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L84)

___

### onAll

▸ **onAll**(`prefix`, `routes`, `options?`): [`MoxyServer`](MoxyServer.md)

Same as calling @MoxyServer.on over Object.entries with a prefx

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `prefix` | `string` | The path prefix to prepend to all routes |
| `routes` | [`Routes`](../README.md#routes) | Path suffix keyed RouteConfig |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Extra router options |

#### Returns

[`MoxyServer`](MoxyServer.md)

#### Defined in

[server/moxy-server.ts:99](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L99)

___

### once

▸ **once**(`path`, `config`, `options?`): [`MoxyServer`](MoxyServer.md)

Add path handler which removes its self after the first response

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `path` | `string` | The path |
| `config` | [`RouteConfig`](../README.md#routeconfig) \| [`Routes`](../README.md#routes) | The configuration |
| `options?` | [`AddRouteOptions`](../interfaces/AddRouteOptions.md) | Extra router options |

#### Returns

[`MoxyServer`](MoxyServer.md)

#### Defined in

[server/moxy-server.ts:127](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L127)

___

### resetRoutes

▸ **resetRoutes**(): [`MoxyServer`](MoxyServer.md)

Clear all routing config

#### Returns

[`MoxyServer`](MoxyServer.md)

#### Defined in

[server/moxy-server.ts:138](https://github.com/acrontum/moxy/blob/527f192/src/server/moxy-server.ts#L138)
