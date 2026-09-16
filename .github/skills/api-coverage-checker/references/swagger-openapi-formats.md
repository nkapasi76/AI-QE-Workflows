# Swagger 2.0 vs OpenAPI 3.0 Format Reference

Quick reference guide for understanding the differences between Swagger 2.0 and OpenAPI 3.0 formats when parsing API documentation.

## Format Detection

### Swagger 2.0

```json
{
  "swagger": "2.0",
  "info": { ... }
}
```

### OpenAPI 3.0

```json
{
  "openapi": "3.0.4",
  "info": { ... }
}
```

## Schema Definitions Location

### Swagger 2.0

Schemas are defined under `definitions`:

```json
{
  "definitions": {
    "CreateOfferRequest": {
      "type": "object",
      "properties": { ... }
    }
  }
}
```

Reference format: `#/definitions/CreateOfferRequest`

### OpenAPI 3.0

Schemas are defined under `components.schemas`:

```json
{
  "components": {
    "schemas": {
      "CreateOfferRequest": {
        "type": "object",
        "properties": { ... }
      }
    }
  }
}
```

Reference format: `#/components/schemas/CreateOfferRequest`

## Request Body Definition

### Swagger 2.0

Request body is defined as a parameter with `in: "body"`:

```json
{
  "paths": {
    "/api/2.0/offers/management/create": {
      "post": {
        "parameters": [
          {
            "in": "body",
            "name": "body",
            "required": true,
            "schema": {
              "$ref": "#/definitions/CreateOfferRequest"
            }
          }
        ]
      }
    }
  }
}
```

### OpenAPI 3.0

Request body has a dedicated `requestBody` object:

```json
{
  "paths": {
    "/api/2.0/offers/management/create": {
      "post": {
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/components/schemas/CreateOfferRequest"
              }
            }
          }
        }
      }
    }
  }
}
```

## Response Definition

### Swagger 2.0

Response schema directly under the status code:

```json
{
  "responses": {
    "200": {
      "description": "Success",
      "schema": {
        "$ref": "#/definitions/OfferResponse"
      }
    }
  }
}
```

### OpenAPI 3.0

Response schema under `content` with media type:

```json
{
  "responses": {
    "200": {
      "description": "Success",
      "content": {
        "application/json": {
          "schema": {
            "$ref": "#/components/schemas/OfferResponse"
          }
        }
      }
    }
  }
}
```

## Path Parameters

### Swagger 2.0 & OpenAPI 3.0

Path parameters are defined similarly in both:

```json
{
  "parameters": [
    {
      "in": "path",
      "name": "offer_id",
      "required": true,
      "type": "string", // Swagger 2.0
      "schema": {
        // OpenAPI 3.0
        "type": "string"
      }
    }
  ]
}
```

## Query Parameters

### Swagger 2.0

```json
{
  "parameters": [
    {
      "in": "query",
      "name": "status",
      "type": "string",
      "enum": ["active", "inactive"]
    }
  ]
}
```

### OpenAPI 3.0

```json
{
  "parameters": [
    {
      "in": "query",
      "name": "status",
      "schema": {
        "type": "string",
        "enum": ["active", "inactive"]
      }
    }
  ]
}
```

## Schema Properties

Both formats use the same structure for schema properties:

```json
{
  "type": "object",
  "required": ["name", "type"],
  "properties": {
    "name": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255
    },
    "type": {
      "type": "string",
      "enum": ["fixed_amount", "percentage"]
    },
    "amount": {
      "type": "number",
      "minimum": 0
    },
    "nested_object": {
      "type": "object",
      "properties": {
        "field": { "type": "string" }
      }
    },
    "array_field": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  }
}
```

## Parsing Strategy

### Universal Parser Approach

```javascript
function getRequestSchema(operation, isOpenAPI3) {
  if (isOpenAPI3) {
    // OpenAPI 3.0 path
    if (operation.requestBody?.content?.['application/json']?.schema) {
      return operation.requestBody.content['application/json'].schema;
    }
  } else {
    // Swagger 2.0 path
    const bodyParam = operation.parameters?.find((p) => p.in === 'body');
    if (bodyParam?.schema) {
      return bodyParam.schema;
    }
  }
  return null;
}

function getResponseSchema(responses, statusCode, isOpenAPI3) {
  const response = responses[statusCode];
  if (!response) return null;

  if (isOpenAPI3) {
    // OpenAPI 3.0 path
    return response.content?.['application/json']?.schema;
  } else {
    // Swagger 2.0 path
    return response.schema;
  }
}

function resolveSchemaRef(ref, swagger, isOpenAPI3) {
  // Extract path from reference
  // Swagger 2.0: #/definitions/SchemaName
  // OpenAPI 3.0: #/components/schemas/SchemaName

  const parts = ref.split('/');
  let current = swagger;

  for (let i = 1; i < parts.length; i++) {
    current = current[parts[i]];
    if (!current) return null;
  }

  return current;
}
```

## Common Patterns in sm-peeves

The project's swagger files use a mix of both formats:

- **Offers API**: OpenAPI 3.0.4
- **Incentives API**: May use Swagger 2.0 or OpenAPI 3.0
- **Catalog API**: May use Swagger 2.0 or OpenAPI 3.0
- **Transactions API**: May use Swagger 2.0 or OpenAPI 3.0

Always detect the format first by checking for `swagger` vs `openapi` field in the root object.

## Field Types Reference

Common field types in both formats:

| Type      | Description                  | Example Values       |
| --------- | ---------------------------- | -------------------- |
| `string`  | Text value                   | `"hello"`, `""`      |
| `number`  | Numeric value (int or float) | `42`, `3.14`         |
| `integer` | Integer value                | `42`, `-10`          |
| `boolean` | True or false                | `true`, `false`      |
| `array`   | List of items                | `[1, 2, 3]`          |
| `object`  | Nested object                | `{ "key": "value" }` |
| `null`    | Null value                   | `null`               |

## Format Modifiers

Both formats support format modifiers:

| Type      | Format      | Description                          |
| --------- | ----------- | ------------------------------------ |
| `string`  | `date`      | Date in ISO 8601 format (YYYY-MM-DD) |
| `string`  | `date-time` | DateTime in ISO 8601 format          |
| `string`  | `uuid`      | UUID format                          |
| `string`  | `email`     | Email address format                 |
| `string`  | `uri`       | URI format                           |
| `number`  | `float`     | Floating point number                |
| `number`  | `double`    | Double precision float               |
| `integer` | `int32`     | 32-bit integer                       |
| `integer` | `int64`     | 64-bit integer                       |

## Validation Keywords

Common validation keywords in both formats:

### String Validation

- `minLength`: Minimum string length
- `maxLength`: Maximum string length
- `pattern`: Regular expression pattern
- `enum`: List of allowed values

### Number Validation

- `minimum`: Minimum value (inclusive)
- `maximum`: Maximum value (inclusive)
- `exclusiveMinimum`: Minimum value (exclusive)
- `exclusiveMaximum`: Maximum value (exclusive)
- `multipleOf`: Value must be multiple of this number

### Array Validation

- `minItems`: Minimum number of items
- `maxItems`: Maximum number of items
- `uniqueItems`: Items must be unique

### Object Validation

- `required`: Array of required property names
- `minProperties`: Minimum number of properties
- `maxProperties`: Maximum number of properties
- `additionalProperties`: Allow additional properties

## References

- Swagger 2.0 Specification: https://swagger.io/specification/v2/
- OpenAPI 3.0 Specification: https://spec.openapis.org/oas/v3.0.0
- JSON Schema Validation: https://json-schema.org/draft/2020-12/json-schema-validation.html
