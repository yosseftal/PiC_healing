import { useState } from "react";
import { useLocale } from "./i18n/locale-provider";
import { resolveEducationMessage } from "./education-messages";
import { UTILITY_CONTROL } from "./control-affordance";

const VIDEO_ID = "txSeLG4kJ6Y";
const WATCH_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;
const EMBED_URL = `https://www.youtube-nocookie.com/embed/${VIDEO_ID}?controls=1&autoplay=0`;

export function OfficialVideo({ title }: { title: string }) {
  const { locale } = useLocale();
  const [activated, setActivated] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const message = (key: "videoActivate" | "videoFallbackAction" | "videoUnavailable" | "videoSource") =>
    resolveEducationMessage(locale, key).text;

  return <section className="grid gap-3" aria-label={title}>
    <h2 className="text-lg font-semibold">{title}</h2>
    <div className="w-full max-w-full overflow-hidden rounded-pic-card bg-pic-ink"
      style={{ aspectRatio: "16 / 9", minHeight: 200 }}>
      {activated && !unavailable ? <iframe
        title={title}
        src={EMBED_URL}
        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onError={() => setUnavailable(true)}
        className="block w-full border-0"
        style={{ aspectRatio: "16 / 9", minHeight: 200 }}
      /> : <div
        className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 p-4 text-center text-white"
      >
        {unavailable ? <p role="status">{message("videoUnavailable")}</p> : <button
          type="button"
          className={UTILITY_CONTROL}
          onClick={() => setActivated(true)}
        >{message("videoActivate")}</button>}
      </div>}
    </div>
    {activated && !unavailable ? <button className={UTILITY_CONTROL} type="button"
      onClick={() => setUnavailable(true)}>{message("videoFallbackAction")}</button> : null}
    <a className={`${UTILITY_CONTROL} w-fit underline underline-offset-4`} href={WATCH_URL}
      target="_blank" rel="noreferrer">{message("videoSource")}</a>
  </section>;
}
