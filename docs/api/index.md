---
title: API Reference
description: API reference and function descriptions.
---

```base
filters:
  and:
    - file.folder == "api" && file.ext == "md"
    - file != this.file
properties:
  file.name:
    displayName: Method
  description:
    displayName: Description
  category:
    displayName: Category
  returns:
    displayName: Returns
  accepts:
    displayName: Accepts
views:
  - type: table
    name: All Methods
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: By Category
    groupBy:
      property: category
      direction: ASC
    order:
      - file.name
      - description
      - returns
      - accepts
  - type: table
    name: Aliases
    filters:
      and:
        - category == "aliases"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Backlinks
    filters:
      and:
        - category == "backlinks"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Blocks
    filters:
      and:
        - category == "blocks"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Embeds
    filters:
      and:
        - category == "embeds"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Frontmatter
    filters:
      and:
        - category == "frontmatter"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Headings
    filters:
      and:
        - category == "headings"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Lifecycle
    filters:
      and:
        - category == "lifecycle"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Tags
    filters:
      and:
        - category == "tags"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts
  - type: table
    name: Tasks
    filters:
      and:
        - category == "tasks"
    order:
      - file.name
      - description
      - category
      - returns
      - accepts

```
