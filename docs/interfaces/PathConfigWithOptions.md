[@acrontum/moxy](../README.md) / PathConfigWithOptions

# Interface: PathConfigWithOptions

## Hierarchy

- [`PathConfig`](../README.md#pathconfig)

  ↳ **`PathConfigWithOptions`**

## Table of contents

### Properties

- [all](PathConfigWithOptions.md#all)
- [connect](PathConfigWithOptions.md#connect)
- [delay](PathConfigWithOptions.md#delay)
- [delete](PathConfigWithOptions.md#delete)
- [exact](PathConfigWithOptions.md#exact)
- [get](PathConfigWithOptions.md#get)
- [head](PathConfigWithOptions.md#head)
- [options](PathConfigWithOptions.md#options)
- [patch](PathConfigWithOptions.md#patch)
- [post](PathConfigWithOptions.md#post)
- [proxy](PathConfigWithOptions.md#proxy)
- [proxyOptions](PathConfigWithOptions.md#proxyoptions)
- [put](PathConfigWithOptions.md#put)
- [trace](PathConfigWithOptions.md#trace)
- [urlRegex](PathConfigWithOptions.md#urlregex)

## Properties

### all

• `Optional` **all**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.all

#### Defined in

[router/index.ts:82](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L82)

___

### connect

• **connect**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.connect

___

### delay

• `Optional` **delay**: `number`

Method-level delay (in milliseconds)

#### Inherited from

PathConfig.delay

#### Defined in

[router/index.ts:32](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L32)

___

### delete

• **delete**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.delete

___

### exact

• `Optional` **exact**: ``true``

If true, will not parse route as regex

#### Inherited from

PathConfig.exact

#### Defined in

[router/index.ts:36](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L36)

___

### get

• **get**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.get

___

### head

• **head**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.head

___

### options

• **options**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.options

___

### patch

• **patch**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.patch

___

### post

• **post**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.post

___

### proxy

• `Optional` **proxy**: `string`

If set, will proxy all requests to the target

#### Inherited from

PathConfig.proxy

#### Defined in

[router/index.ts:24](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L24)

___

### proxyOptions

• `Optional` **proxyOptions**: `RequestOptions`

Options to pass through proxy

#### Inherited from

PathConfig.proxyOptions

#### Defined in

[router/index.ts:28](https://github.com/acrontum/moxy/blob/527f192/src/router/index.ts#L28)

___

### put

• **put**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.put

___

### trace

• **trace**: [`MethodConfig`](../README.md#methodconfig)

#### Inherited from

PathConfig.trace

___

### urlRegex

• `Optional` **urlRegex**: `RegExp`

#### Defined in

[router/router.ts:33](https://github.com/acrontum/moxy/blob/527f192/src/router/router.ts#L33)
