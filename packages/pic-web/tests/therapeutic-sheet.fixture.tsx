import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { TherapeuticSheet } from "../src/therapeutic-sheet";
import "../src/visual-foundation/visual-foundation.css";

const direction = new URLSearchParams(window.location.search).get("direction") === "rtl" ? "rtl" : "ltr";
document.documentElement.dir = direction;

function SheetFixture() {
  return (
    <main className="min-h-screen p-4" data-testid="fixture-background">
      <button type="button">Background before</button>
      <TherapeuticSheet
        description="A bounded context for sovereign session utilities."
        title="Session utilities"
        trigger="Utilities"
        triggerLabel="Open session utilities"
      >
        <div className="grid gap-3">
          {Array.from({ length: 60 }, (_, index) => (
            <button className="min-h-11 rounded-pic-button border border-pic-line" key={index} type="button">
              Utility {index + 1}
            </button>
          ))}
        </div>
      </TherapeuticSheet>
      <button type="button">Background after</button>
    </main>
  );
}

const rootElement = document.getElementById("sheet-fixture-root");
if (rootElement === null) {
  throw new Error("Therapeutic Sheet fixture root is missing");
}

createRoot(rootElement).render(
  <StrictMode>
    <SheetFixture />
  </StrictMode>,
);
