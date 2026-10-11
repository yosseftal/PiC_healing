import { useId, useState } from "react";
import { UTILITY_CONTROL } from "../control-affordance";
import { useLocale } from "./locale-provider";
import { LocalizedMessage } from "./localized-message";
import type { Locale } from "./locale";

export function LanguageSelector() {
  const { locale, selectLocale, message } = useLocale();
  const headingId = useId();
  const [announced, setAnnounced] = useState(false);
  function choose(nextLocale: Locale) {
    if (nextLocale === locale) return;
    selectLocale(nextLocale);
    setAnnounced(true);
  }
  return (
    <div role="group" aria-labelledby={headingId} className="grid gap-3">
      <h3 id={headingId} className="m-0 text-pic-ink font-pic-heading">
        <LocalizedMessage message={message("language.label")} />
      </h3>
      <div className="flex flex-wrap gap-3">
        <button
          type="button" className={UTILITY_CONTROL} aria-pressed={locale === "he"}
          lang="he" dir="rtl" onClick={() => choose("he")}
        >עברית</button>
        <button
          type="button" className={UTILITY_CONTROL} aria-pressed={locale === "en"}
          lang="en" dir="ltr" onClick={() => choose("en")}
        >English</button>
      </div>
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="locale-announcement">
        {announced ? <LocalizedMessage message={message("language.changed")} /> : null}
      </span>
    </div>
  );
}
