import { createRoot } from "react-dom/client";
import "../src/visual-foundation/visual-foundation.css";
import {
  TherapeuticContentCard,
  TherapeuticFrame,
  TherapeuticTableScroller,
} from "../src/therapeutic-frame/TherapeuticFrame";

const rootElement = document.getElementById("root");
if (rootElement === null) {
  throw new Error("Therapeutic frame fixture requires #root");
}

const direction = new URLSearchParams(window.location.search).get("direction");
document.documentElement.dir = direction === "rtl" ? "rtl" : "ltr";

const guidanceLines = Array.from(
  { length: 80 },
  (_, index) => `Long guidance line ${index + 1}: pause, notice, and continue at your own pace.`,
);
const tableColumns = Array.from({ length: 12 }, (_, index) => `Treatment detail ${index + 1}`);

createRoot(rootElement).render(
  <TherapeuticFrame
    eyebrow="Inquiry"
    progress={<span>Step 2 of 4</span>}
    quietStatus={<span>Available locally</span>}
    stageLabel="Active therapeutic stage"
    title="Therapeutic viewport"
    utilityTrigger={<button type="button">Open utilities</button>}
  >
    <TherapeuticContentCard aria-label="Long guidance">
      <h2>Current guidance</h2>
      {guidanceLines.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <TherapeuticTableScroller aria-label="Wide treatment table">
        <table style={{ minWidth: "1800px" }}>
          <tbody>
            <tr>
              {tableColumns.map((column) => (
                <td key={column}>{column}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </TherapeuticTableScroller>
    </TherapeuticContentCard>
  </TherapeuticFrame>,
);
