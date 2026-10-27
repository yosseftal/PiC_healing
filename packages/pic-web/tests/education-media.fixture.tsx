import { createRoot } from "react-dom/client";
import { OfficialVideo } from "../src/OfficialVideo";
import { LocaleProvider } from "../src/i18n/locale-provider";
import "../src/visual-foundation/visual-foundation.css";

const rootElement = document.getElementById("root");
if (rootElement === null) throw new Error("Education media fixture needs #root");

const locale = new URLSearchParams(location.search).get("locale") === "he" ? "he" : "en";
localStorage.setItem("pic-web.locale.v1", locale);
const root = createRoot(rootElement);
root.render(
  <LocaleProvider>
    <main className="mx-auto grid min-h-dvh w-full max-w-3xl content-start gap-6 p-4 text-pic-ink">
      <OfficialVideo title={locale === "he" ? "הדגמת השיטה הרשמית" : "Official method demonstration"} />
    </main>
  </LocaleProvider>,
);

window.addEventListener("fixture-unmount", () => root.unmount(), { once: true });
