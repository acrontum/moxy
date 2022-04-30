[@acrontum/moxy](../README.md) / MoxyRequest

# Class: MoxyRequest

## Hierarchy

- `IncomingMessage`

  ↳ **`MoxyRequest`**

## Table of contents

### Constructors

- [constructor](MoxyRequest.md#constructor)

### Properties

- [#path](MoxyRequest.md##path)
- [#query](MoxyRequest.md##query)
- [body](MoxyRequest.md#body)
- [id](MoxyRequest.md#id)
- [timestamp](MoxyRequest.md#timestamp)

### Accessors

- [path](MoxyRequest.md#path)
- [query](MoxyRequest.md#query)

### Methods

- [getBody](MoxyRequest.md#getbody)
- [parseBody](MoxyRequest.md#parsebody)

## Constructors

### constructor

• **new MoxyRequest**(`socket`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `socket` | `Socket` |

#### Overrides

IncomingMessage.constructor

#### Defined in

[server/request.ts:24](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L24)

## Properties

### #path

• `Private` **#path**: `string`

#### Defined in

[server/request.ts:22](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L22)

___

### #query

• `Private` **#query**: `ParsedUrlQuery`

#### Defined in

[server/request.ts:21](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L21)

___

### body

• **body**: `Promise`<`Buffer`\>

A promise which resolves to the request body

#### Defined in

[server/request.ts:11](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L11)

___

### id

• **id**: `string`

Unique request UUID

#### Defined in

[server/request.ts:15](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L15)

___

### timestamp

• **timestamp**: `number`

The unix timestamp of the request

#### Defined in

[server/request.ts:19](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L19)

## Accessors

### path

• `get` **path**(): `string`

Get the request path without hash or search

#### Returns

`string`

#### Defined in

[server/request.ts:52](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L52)

___

### query

• `get` **query**(): `ParsedUrlQuery`

Get the parsed query params

#### Returns

`ParsedUrlQuery`

#### Defined in

[server/request.ts:43](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L43)

## Methods

### getBody

▸ **getBody**(`format`): `Promise`<`Buffer`\>

Gets the body

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `format` | ``"buffer"`` | The desired body format (defaults to content-type header) |

#### Returns

`Promise`<`Buffer`\>

#### Defined in

[server/request.ts:61](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L61)

▸ **getBody**(`format`): `Promise`<`string`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"string"`` |

#### Returns

`Promise`<`string`\>

#### Defined in

[server/request.ts:62](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L62)

▸ **getBody**(`format`): `Promise`<`Record`<`string`, `any`\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `format` | ``"json"`` |

#### Returns

`Promise`<`Record`<`string`, `any`\>\>

#### Defined in

[server/request.ts:63](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L63)

___

### parseBody

▸ **parseBody**(`body`): `string` \| `Record`<`string`, `any`\> \| `Buffer`

Parse the body using conten-type header

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `body` | `Buffer` | The body |

#### Returns

`string` \| `Record`<`string`, `any`\> \| `Buffer`

#### Defined in

[server/request.ts:85](https://github.com/acrontum/moxy/blob/527f192/src/server/request.ts#L85)
