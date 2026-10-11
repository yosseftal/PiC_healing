import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { LocaleProvider, useLocale } from "../src/i18n/locale-provider";
import { HorizontalSlideContainer } from "../src/HorizontalSlideContainer";
import { TherapeuticScreenFrame } from "../src/therapeutic-frame/TherapeuticScreenFrame";
import { TherapeuticContentCard, TherapeuticTableScroller } from "../src/therapeutic-frame/TherapeuticFrame";
import { UTILITY_CONTROL } from "../src/control-affordance";
import "../src/visual-foundation/visual-foundation.css";
import "./rtl-composition.fixture.css";

function CompositionDemo() {
  const { locale } = useLocale();
  const [activeKey, setActiveKey] = useState("first");
  const [reordered, setReordered] = useState(false);
  const [completions, setCompletions] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const hebrew = locale === "he";
  return (
    <TherapeuticScreenFrame
      title={hebrew ? "מרחב להקשבה — Dana, 8/10" : "A space to listen — Dana, 8/10"}
      stageLabel={hebrew ? "הנחיה נוכחית" : "Current guidance"}
      utilities={(
        <div className="grid gap-3">
          <button className={UTILITY_CONTROL} onClick={() => setActiveKey("second")}>Forward</button>
          <button className={UTILITY_CONTROL} onClick={() => setActiveKey("first")}>Backward</button>
          <button className={UTILITY_CONTROL} onClick={() => {
            setReordered((value) => !value);
            setActiveKey("third");
          }}>Replace order</button>
          <output aria-label="Presentation completions">{completions}</output>
          {Array.from({ length: 30 }, (_, index) => <p key={index}>כלים נוספים — Utility {index + 1}</p>)}
        </div>
      )}
    >
      <div className="demo-layout">
        <HorizontalSlideContainer
        activeKey={activeKey} orderedKeys={reordered ? ["third", "second", "first"] : ["first", "second", "third"]}
        stepLabel={hebrew ? "שלב נוכחי" : "Current step"} userInitiated focusTargetRef={heading}
        onTransitionComplete={() => setCompletions((value) => value + 1)}
      >
        <TherapeuticContentCard aria-label={hebrew ? "תוכן ההנחיה" : "Guidance content"}>
          <h2 ref={heading} tabIndex={-1}>{activeKey}</h2>
          <TherapeuticTableScroller aria-label="Wide table">
            <table style={{ minWidth: 1800 }}><tbody><tr>
              {Array.from({ length: 12 }, (_, index) => <td style={{ minWidth: 150 }} key={index}>
                פרט טיפול — Detail {index + 1}
              </td>)}
            </tr></tbody></table>
          </TherapeuticTableScroller>
          {Array.from({ length: 80 }, (_, index) => (
            <p key={index}>{hebrew ? "אפשר לעצור, להקשיב לגוף ולהמשיך בזמן המתאים לך." :
              "Pause, listen to your body and continue at your own pace."} Dana — 8/10 ({index + 1})</p>
          ))}
        </TherapeuticContentCard>
        </HorizontalSlideContainer>
        <div role="group" aria-label="Demo actions" className="flex flex-wrap gap-3">
          <button className={UTILITY_CONTROL} onClick={() => setActiveKey("first")}>
            {hebrew ? "הנחיה קודמת" : "Previous guidance"}
          </button>
          <button className={UTILITY_CONTROL} onClick={() => setActiveKey("second")}>
            {hebrew ? "הנחיה הבאה" : "Next guidance"}
          </button>
        </div>
      </div>
    </TherapeuticScreenFrame>
  );
}

const root = document.getElementById("root");
if (root === null) throw new Error("Composition demo requires #root");
createRoot(root).render(<LocaleProvider><CompositionDemo /></LocaleProvider>);
