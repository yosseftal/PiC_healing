import { directionFor, isLocale, type Direction, type Locale } from "./locale";

export type MessageDefinition = { params: readonly string[]; plural?: string };
export type MessageDefinitions = Record<string, MessageDefinition>;
export type MessageTemplate = string | Partial<Record<Intl.LDMLPluralRule, string>>;
export type MessageDictionaries<D extends MessageDefinitions> = Record<Locale, Partial<Record<keyof D, MessageTemplate>>>;
export type MessageParameters<D extends MessageDefinitions, K extends keyof D> = {
  [P in D[K]["params"][number]]: D[K] extends { plural: P } ? number : string | number;
};
export type MessageArguments<D extends MessageDefinitions, K extends keyof D> =
  D[K]["params"][number] extends never ? [] : [params: MessageParameters<D, K>];

export interface ResolvedMessage {
  text: string;
  parts: (string | { parameter: string; text: string })[];
  locale: Locale;
  direction: Direction;
  fallback: boolean;
}

export type MessageResolver<D extends MessageDefinitions> = <K extends keyof D>(
  locale: Locale, key: K, ...args: MessageArguments<D, K>
) => ResolvedMessage;

function validTemplate(template: unknown, definition: MessageDefinition): template is string {
  if (typeof template !== "string" || template.trim().length === 0) return false;
  const tokens = [...template.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)].map((match) => match[1]);
  const remainder = template.replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, "");
  return !/[{}]/.test(remainder) && tokens.every((token) => definition.params.includes(token)) &&
    definition.params.every((parameter) => tokens.includes(parameter));
}

function validParameters(definition: MessageDefinition, params: Record<string, string | number>): boolean {
  return params !== null && typeof params === "object" &&
    Object.keys(params).length === definition.params.length &&
    definition.params.every((parameter) => Object.hasOwn(params, parameter) &&
      (typeof params[parameter] === "string" ||
        typeof params[parameter] === "number" && Number.isFinite(params[parameter]))) &&
    (definition.plural === undefined || typeof params[definition.plural] === "number");
}

export function validateMessages<D extends MessageDefinitions>(
  definitions: D, dictionaries: MessageDictionaries<D>,
): string[] {
  const defects: string[] = [];
  for (const locale of ["he", "en"] as const) {
    for (const key of Object.keys(dictionaries[locale])) {
      if (!Object.hasOwn(definitions, key)) defects.push(`${locale}:${key}: unknown key`);
    }
    for (const [key, definition] of Object.entries(definitions)) {
      const entry = dictionaries[locale][key];
      if (definition.plural === undefined) {
        if (!validTemplate(entry, definition)) defects.push(`${locale}:${key}: missing or invalid template`);
      } else {
        const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
        for (const category of categories) {
          const template = typeof entry === "object" && entry !== null ? entry[category] : undefined;
          if (!validTemplate(template, definition)) defects.push(`${locale}:${key}:${category}: missing or invalid plural`);
        }
      }
    }
  }
  return defects;
}

export function createMessageResolver<D extends MessageDefinitions>(
  definitions: D, dictionaries: MessageDictionaries<D>, unavailableKey: keyof D,
  report: (defect: string) => void = () => {},
): MessageResolver<D> {
  const resolve = (
    locale: Locale, key: keyof D, params: Record<string, string | number>, unavailable = false,
  ): ResolvedMessage => {
    const definition = Object.hasOwn(definitions, key) ? definitions[key] : undefined;
    if (definition === undefined || !validParameters(definition, params)) {
      report("Unknown message key or invalid parameters");
      if (unavailable) throw new Error("Approved availability message must be a parameter-free template");
      return resolve(locale, unavailableKey, {}, true);
    }
    const candidates = [...new Set<Locale>([locale, "he", "en"])];
    const templateFor = (candidate: Locale) => {
      const entry = dictionaries[candidate][key];
      if (definition.plural === undefined) return entry;
      if (entry === null || typeof entry !== "object") return undefined;
      const count = params[definition.plural];
      return typeof count === "number" && Number.isFinite(count)
        ? entry?.[new Intl.PluralRules(candidate).select(count)] : undefined;
    };
    const resolvedLocale = candidates.find((candidate) => validTemplate(templateFor(candidate), definition));
    const template = resolvedLocale === undefined ? undefined : templateFor(resolvedLocale);
    if (!definition || resolvedLocale === undefined || !validTemplate(template, definition)) {
      report("Approved message template unavailable");
      if (unavailable) throw new Error("Approved availability message is required");
      return resolve(locale, unavailableKey, {}, true);
    }
    const parts: ResolvedMessage["parts"] = [];
    let offset = 0;
    for (const match of template.matchAll(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g)) {
      parts.push(template.slice(offset, match.index));
      const value = params[match[1]];
      const text = typeof value === "number" ? new Intl.NumberFormat(locale).format(value) : value;
      parts.push({ parameter: match[1], text });
      offset = match.index + match[0].length;
    }
    parts.push(template.slice(offset));
    return {
      text: parts.map((part) => typeof part === "string" ? part : part.text).join(""),
      parts, locale: resolvedLocale, direction: directionFor(resolvedLocale), fallback: unavailable || resolvedLocale !== locale,
    };
  };
  return ((locale: Locale, key: keyof D, params: Record<string, string | number> = {}) => {
    if (!isLocale(locale)) {
      report("Unsupported message locale");
      return { ...resolve("he", key, params), fallback: true };
    }
    return resolve(locale, key, params);
  }) as MessageResolver<D>;
}
