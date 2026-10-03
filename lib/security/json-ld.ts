/** Keep JSON valid while preventing HTML's script parser from seeing a closing tag. */
export function serializeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
