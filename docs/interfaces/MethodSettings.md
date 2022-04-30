[@acrontum/moxy](../README.md) / MethodSettings

# Interface: MethodSettings

## Hierarchy

- [`PathSettings`](PathSettings.md)

  ↳ **`MethodSettings`**

## Table of contents

### Properties

- [body](MethodSettings.md#body)
- [delay](MethodSettings.md#delay)
- [exact](MethodSettings.md#exact)
- [handler](MethodSettings.md#handler)
- [headers](MethodSettings.md#headers)
- [proxy](MethodSettings.md#proxy)
- [proxyOptions](MethodSettings.md#proxyoptions)
- [status](MethodSettings.md#status)

## Properties

### body

• `Optional` **body**: `any`

response payload

#### Defined in

[router/index.ts:47](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L47)

___

### delay

• `Optional` **delay**: `number`

Method-level delay (in milliseconds)

#### Inherited from

[PathSettings](PathSettings.md).[delay](PathSettings.md#delay)

#### Defined in

[router/index.ts:32](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L32)

___

### exact

• `Optional` **exact**: ``true``

If true, will not parse route as regex

#### Inherited from

[PathSettings](PathSettings.md).[exact](PathSettings.md#exact)

#### Defined in

[router/index.ts:36](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L36)

___

### handler

• `Optional` **handler**: [`RequestHandler`](../README.md#requesthandler)

HTTP request handler function

#### Defined in

[router/index.ts:55](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L55)

___

### headers

• `Optional` **headers**: `OutgoingHttpHeaders`

headers to add (Content-Type is added automatically)

#### Defined in

[router/index.ts:51](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L51)

___

### proxy

• `Optional` **proxy**: `string`

If set, will proxy all requests to the target

#### Inherited from

[PathSettings](PathSettings.md).[proxy](PathSettings.md#proxy)

#### Defined in

[router/index.ts:24](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L24)

___

### proxyOptions

• `Optional` **proxyOptions**: `RequestOptions`

Options to pass through proxy

#### Inherited from

[PathSettings](PathSettings.md).[proxyOptions](PathSettings.md#proxyoptions)

#### Defined in

[router/index.ts:28](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L28)

___

### status

• `Optional` **status**: `number`

status code to return (defaults to 200)

#### Defined in

[router/index.ts:43](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L43)
