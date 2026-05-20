---
description: "Check if singleton exists"
category: lifecycle
returns: "boolean"
accepts: "none"
---
# hasAPI

```typescript
function hasAPI(): boolean
```

Checks whether a shared `ExtendedMetadataCache` instance exists for the current API major version, without creating one.

## Returns

`boolean` — `true` if another plugin has already called [[getAPI]].

## Example

```typescript
import { hasAPI } from "obsidian-extended-metadatacache";

if (hasAPI()) {
  console.log("Extended cache is already initialized by another plugin");
}
```

## Related

- [[getAPI]] — acquire the instance
- [[Singleton Pattern]] — how sharing works
