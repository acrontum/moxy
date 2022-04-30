[@acrontum/moxy](../README.md) / MoxyResponse

# Class: MoxyResponse

## Hierarchy

- `ServerResponse`

  ↳ **`MoxyResponse`**

## Table of contents

### Constructors

- [constructor](MoxyResponse.md#constructor)

### Properties

- [#chunks](MoxyResponse.md##chunks)
- [duration](MoxyResponse.md#duration)
- [id](MoxyResponse.md#id)

### Accessors

- [body](MoxyResponse.md#body)

### Methods

- [end](MoxyResponse.md#end)
- [getContentTypeFromFileExt](MoxyResponse.md#getcontenttypefromfileext)
- [parseBody](MoxyResponse.md#parsebody)
- [sendFile](MoxyResponse.md#sendfile)
- [sendJson](MoxyResponse.md#sendjson)
- [setHeaders](MoxyResponse.md#setheaders)
- [write](MoxyResponse.md#write)

## Constructors

### constructor

• **new MoxyResponse**(`req`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `req` | [`MoxyRequest`](MoxyRequest.md) |

#### Overrides

ServerResponse.constructor

#### Defined in

[server/response.ts:23](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L23)

## Properties

### #chunks

• `Private` **#chunks**: `any`[] = `[]`

#### Defined in

[server/response.ts:21](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L21)

___

### duration

• **duration**: `number`

Request duration in ms

#### Defined in

[server/response.ts:19](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L19)

___

### id

• **id**: `string`

Unique request UUID

#### Defined in

[server/response.ts:15](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L15)

## Accessors

### body

• `get` **body**(): `string` \| `Record`<`string`, `any`\> \| `Buffer`

The response body

#### Returns

`string` \| `Record`<`string`, `any`\> \| `Buffer`

#### Defined in

[server/response.ts:38](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L38)

## Methods

### end

▸ **end**(...`args`): `void`

Overwrite writableend to store body internally

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...args` | `any`[] | The arguments |

#### Returns

`void`

#### Overrides

ServerResponse.end

#### Defined in

[server/response.ts:176](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L176)

___

### getContentTypeFromFileExt

▸ **getContentTypeFromFileExt**(`filename`): `string`

Gets the content type from file extention

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filename` | `string` | The filename |

#### Returns

`string`

#### Defined in

[server/response.ts:102](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L102)

___

### parseBody

▸ **parseBody**(`body`): `string` \| `Record`<`string`, `any`\> \| `Buffer`

Parse the response body based on content-type

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `body` | `Buffer` | The body |

#### Returns

`string` \| `Record`<`string`, `any`\> \| `Buffer`

#### Defined in

[server/response.ts:140](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L140)

___

### sendFile

▸ **sendFile**(`filename`, `options?`): [`MoxyResponse`](MoxyResponse.md)

Sends a file

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `filename` | `string` | The json |
| `options?` | [`SendOptions`](../interfaces/SendOptions.md) | Reponse options |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[server/response.ts:70](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L70)

___

### sendJson

▸ **sendJson**(`json`, `options?`): [`MoxyResponse`](MoxyResponse.md)

Sends a json response

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `json` | `string` \| `Record`<`string`, `any`\> | The json |
| `options?` | [`SendOptions`](../interfaces/SendOptions.md) | Reponse options |

#### Returns

[`MoxyResponse`](MoxyResponse.md)

#### Defined in

[server/response.ts:50](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L50)

___

### setHeaders

▸ **setHeaders**(`headers`): `void`

Set response headers
The writeHead method buffers headers, so they are not available for
logging without calling setHeaders

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `headers` | `Record`<`string`, `string` \| `number` \| readonly `string`[]\> | The headers |

#### Returns

`void`

#### Defined in

[server/response.ts:127](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L127)

___

### write

▸ **write**(`chunk`, ...`args`): `boolean`

Override writablewrite to store body internally

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `chunk` | `string` | The chunk |
| `...args` | `any`[] | The arguments |

#### Returns

`boolean`

#### Overrides

ServerResponse.write

#### Defined in

[server/response.ts:164](https://github.com/acrontum/moxy/blob/09d4c53/src/server/response.ts#L164)
