import { createRoot } from "react-dom/client";
import { App } from "../src/App";
import "../src/visual-foundation/visual-foundation.css";

const locale = new URLSearchParams(location.search).get("locale") === "he" ? "he" : "en";
localStorage.setItem("pic-web.locale.v1", locale);
createRoot(document.getElementById("root")!).render(<App />);
