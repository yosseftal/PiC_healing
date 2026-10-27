import { createRoot } from "react-dom/client";
import { AppProviders } from "../src/app-providers";
import { GuestFlowRouter } from "../src/guest-flow-router";
import "../src/visual-foundation/visual-foundation.css";

const locale = new URLSearchParams(location.search).get("locale") === "he" ? "he" : "en";
localStorage.setItem("pic-web.locale.v1", locale);

const root = document.getElementById("root");
if (root === null) throw new Error("W13-07 fixture needs #root");
createRoot(root).render(<AppProviders><GuestFlowRouter /></AppProviders>);
