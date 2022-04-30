[@acrontum/moxy](../README.md) / RouterNet

# Class: RouterNet

## Table of contents

### Constructors

- [constructor](RouterNet.md#constructor)

### Properties

- [#logger](RouterNet.md##logger)
- [#router](RouterNet.md##router)

### Methods

- [#applyReplacements](RouterNet.md##applyreplacements)
- [#parseConfigRoute](RouterNet.md##parseconfigroute)
- [createProxy](RouterNet.md#createproxy)
- [parsePlaceholderParams](RouterNet.md#parseplaceholderparams)
- [requestListener](RouterNet.md#requestlistener)
- [tryHandleRequest](RouterNet.md#tryhandlerequest)

## Constructors

### constructor

• **new RouterNet**(`router`, `logger`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `router` | [`Router`](Router.md) |
| `logger` | [`Logger`](Logger.md) |

#### Defined in

[router/router-net.ts:23](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L23)

## Properties

### #logger

• `Private` **#logger**: [`Logger`](Logger.md)

#### Defined in

[router/router-net.ts:21](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L21)

___

### #router

• `Private` **#router**: [`Router`](Router.md)

#### Defined in

[router/router-net.ts:20](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L20)

## Methods

### #applyReplacements

▸ `Private` **#applyReplacements**(`payload`, `variables`): `string`

Replace params in payload with those from url placeholders

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `payload` | `string` | The payload |
| `variables` | [`HandlerVariables`](../README.md#handlervariables) | Replacements, including match groups and query params |

#### Returns

`string`

#### Defined in

[router/router-net.ts:245](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L245)

___

### #parseConfigRoute

▸ `Private` **#parseConfigRoute**(`res`, `route`, `pathConfig`, `variables`): `Promise`<`void` \| [`MoxyResponse`](MoxyResponse.md)\>

Parse and response to configured route

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The response |
| `route` | [`MethodSettings`](../interfaces/MethodSettings.md) | Route configuration |
| `pathConfig` | [`PathConfig`](../README.md#pathconfig) | Path configuration |
| `variables` | [`HandlerVariables`](../README.md#handlervariables) | Replacements, including match groups and query params |

#### Returns

`Promise`<`void` \| [`MoxyResponse`](MoxyResponse.md)\>

#### Defined in

[router/router-net.ts:209](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L209)

___

### createProxy

▸ **createProxy**(`request`, `response`, `proxyUrl`, `options?`): `void`

Creates a simple opaque proxy

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `request` | `IncomingMessage` | The request |
| `response` | `ServerResponse` | The response |
| `proxyUrl` | `string` | The proxy url |
| `options?` | `RequestOptions` | The request options |

#### Returns

`void`

#### Defined in

[router/router-net.ts:36](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L36)

___

### parsePlaceholderParams

▸ **parsePlaceholderParams**(`url`): `string`

Convert simple replacement params into regex match groups

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `url` | `string` | The url |

#### Returns

`string`

#### Defined in

[router/router-net.ts:191](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L191)

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

[router/router-net.ts:72](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L72)

___

### tryHandleRequest

▸ **tryHandleRequest**(`req`, `res`, `url`, `routeConfig`): `Promise`<`void` \| [`MoxyResponse`](MoxyResponse.md)\>

Handles server request based on path config

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) | The request |
| `res` | [`MoxyResponse`](MoxyResponse.md) | The resource |
| `url` | `string` | The url to test |
| `routeConfig` | [`ParsedPathConfig`](../README.md#parsedpathconfig) | The parsed route config |

#### Returns

`Promise`<`void` \| [`MoxyResponse`](MoxyResponse.md)\>

#### Defined in

[router/router-net.ts:124](https://github.com/acrontum/moxy/blob/09d4c53/src/router/router-net.ts#L124)
