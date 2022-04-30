[@acrontum/moxy](../README.md) / PathSettings

# Interface: PathSettings

## Hierarchy

- **`PathSettings`**

  ↳ [`MethodSettings`](MethodSettings.md)

## Table of contents

### Properties

- [delay](PathSettings.md#delay)
- [exact](PathSettings.md#exact)
- [proxy](PathSettings.md#proxy)
- [proxyOptions](PathSettings.md#proxyoptions)

## Properties

### delay

• `Optional` **delay**: `number`

Method-level delay (in milliseconds)

#### Defined in

[router/index.ts:32](https://github.com/acrontum/moxy/blob/09d4c53/src/router/index.ts#L32)

___

### exact

• `Optional` **exact**: ``true``

If true, will not parse route as regex

#### Defined in

[router/index.ts:36](https://github.com/acrontum/moxy/blob/09d4c53/src/router/index.ts#L36)

___

### proxy

• `Optional` **proxy**: `string`

If set, will proxy all requests to the target

#### Defined in

[router/index.ts:24](https://github.com/acrontum/moxy/blob/09d4c53/src/router/index.ts#L24)

___

### proxyOptions

• `Optional` **proxyOptions**: `RequestOptions`

Options to pass through proxy

#### Defined in

[router/index.ts:28](https://github.com/acrontum/moxy/blob/09d4c53/src/router/index.ts#L28)
