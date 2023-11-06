---
to: src/schemas/<%= name %>.schema.json
---
{
  "type": "object",
  "properties": {
    "foo": {
      "type": "string",
      "errorMessage": {
        "type": "Invalid value"
      }
    }
  },
  "required": [],
  "additionalProperties": false
}
