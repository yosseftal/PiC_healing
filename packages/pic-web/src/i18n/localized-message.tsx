import type { ResolvedMessage } from "./messages";

/** React escapes every text fragment; personal inserts receive independent bidi isolation. */
export function LocalizedMessage({ message }: { message: ResolvedMessage }) {
  return (
    <span lang={message.locale} dir={message.direction}>
      {message.parts.map((part, index) => typeof part === "string" ? part : (
        <bdi dir="auto" data-pic-literal key={`${part.parameter}-${index}`}>{part.text}</bdi>
      ))}
    </span>
  );
}
