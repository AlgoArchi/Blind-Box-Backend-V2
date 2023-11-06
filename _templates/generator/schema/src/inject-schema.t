---
to: src/schemas/index.js
inject: true
after: "module.exports = {"
skip_if: "<%= h.changeCase.camel(name) %>,"
---
  <%= h.changeCase.camel(name) %>,