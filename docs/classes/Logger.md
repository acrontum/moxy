[@acrontum/moxy](../README.md) / Logger

# Class: Logger

## Table of contents

### Constructors

- [constructor](Logger.md#constructor)

### Properties

- [level](Logger.md#level)

### Methods

- [debug](Logger.md#debug)
- [error](Logger.md#error)
- [info](Logger.md#info)
- [log](Logger.md#log)
- [logIfEnabled](Logger.md#logifenabled)
- [trace](Logger.md#trace)
- [warn](Logger.md#warn)

## Constructors

### constructor

• **new Logger**(`level?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `level?` | `string` |

#### Defined in

[util/logger.ts:6](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L6)

## Properties

### level

• **level**: `string` = `'verbose'`

#### Defined in

[util/logger.ts:4](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L4)

## Methods

### debug

▸ **debug**(...`args`): `void`

Same as console.debug. Will not log if level is 'error' or 'off'

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:27](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L27)

___

### error

▸ **error**(...`args`): `void`

Same as console.error. Will always log

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:41](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L41)

___

### info

▸ **info**(...`args`): `void`

Same as console.info. Will not log if level is 'error' or 'off'

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:20](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L20)

___

### log

▸ **log**(...`args`): `void`

Same as console.log. Will not log if level is 'error' or 'off'

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:13](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L13)

___

### logIfEnabled

▸ **logIfEnabled**(`method`, ...`args`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `method` | keyof `Console` |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:52](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L52)

___

### trace

▸ **trace**(...`args`): `void`

Same as console.trace. Will always log

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:48](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L48)

___

### warn

▸ **warn**(...`args`): `void`

Same as console.warn. Will not log if level is 'error' or 'off'

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | `any`[] |

#### Returns

`void`

#### Defined in

[util/logger.ts:34](https://github.com/acrontum/moxy/blob/527f192/src/util/logger.ts#L34)
