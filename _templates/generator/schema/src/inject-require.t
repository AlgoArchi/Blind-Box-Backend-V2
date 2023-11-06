---
to: src/schemas/index.js
inject: true
at_line: 0
skip_if: "const <%= h.changeCase.camel(name) %>"
---
const <%= h.changeCase.camel(name) %> = require('./<%= name %>.schema.json');