/**
 * Incrementally extracts complete objects from a JSON array while the JSON
 * text is still streaming, e.g. each item of `{"books":[{...},{...}]}` or of
 * a top-level `[{...}]`. Objects are emitted as soon as their closing brace
 * arrives. Keep this file free of imports so it can be unit tested directly.
 */
export function createArrayObjectExtractor() {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  let capture: string | null = null;
  let captureDepth = 0;

  return {
    push(chunk: string): unknown[] {
      const objects: unknown[] = [];

      for (const char of chunk) {
        if (capture !== null) capture += char;

        if (inString) {
          if (escaped) escaped = false;
          else if (char === "\\") escaped = true;
          else if (char === "\"") inString = false;
          continue;
        }

        if (char === "\"") {
          inString = true;
        } else if (char === "{" || char === "[") {
          const parent = stack[stack.length - 1];
          // Array items of the top-level value, or of a property of it.
          if (char === "{" && capture === null && parent === "[" && stack.length <= 2) {
            capture = "{";
            captureDepth = stack.length;
          }
          stack.push(char);
        } else if (char === "}" || char === "]") {
          stack.pop();
          if (capture !== null && char === "}" && stack.length === captureDepth) {
            try {
              objects.push(JSON.parse(capture));
            } catch {
              // Skip a malformed item; the rest of the stream may still be usable.
            }
            capture = null;
          }
        }
      }

      return objects;
    },
  };
}
