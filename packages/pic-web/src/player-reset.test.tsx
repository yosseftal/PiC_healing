// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { TERMINAL_NEMAR_UNIT_ID } from "pic-engine";

afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

for (const locale of ["en", "he"] as const) {
  for (const linked of [false, true]) {
    it.each(["yes", "no"] as const)(`${locale} linked=${linked} reset preserves terminal %s until confirmed`, async (answer) => {
      vi.resetModules();
      localStorage.clear();
      localStorage.setItem("pic-web.locale.v1", locale);
      const { compositionRoot: root } = await import("./composition-root");
      await import("./guest-flow-facts");
      const { App } = await import("./App");
      const groupId = linked ? await root.groupEngineActions.createDraftGroup("Personal group") : null;
      const treatment = (await root.catalogActions.listTreatments())[0]!;
      const units = await root.treatmentContentActions.getParsedTreatmentContent(treatment.id);
      const sessionId = await root.playerEngineActions.startSession(treatment.id, groupId, units.map((unit) => unit.unit_id));
      await root.playerEngineActions.jumpTo(sessionId, TERMINAL_NEMAR_UNIT_ID);
      await root.playerEngineActions.respondTerminalNemar(sessionId, answer);
      const before = await root.repositoryPort.getPlayerSession(sessionId);
      render(<App />);
      await screen.findByTestId("terminal-nemar-unit");
      const en = locale === "en";
      fireEvent.click(screen.getByRole("button", { name: en ? "Open Player utilities" : "פתיחת כלי הנגן" }));
      const name = en ? "New symptom group" : "קבוצת סימפטומים חדשה";
      fireEvent.click(screen.getByRole("button", { name }));
      const keep = await screen.findByRole("button", { name: en ? "Keep current inquiry" : "להמשיך בבירור הנוכחי" });
      await waitFor(() => expect(document.activeElement).toBe(keep));
      expect(screen.getAllByRole("dialog")).toHaveLength(1);
      fireEvent.click(keep);
      expect(await root.repositoryPort.getPlayerSession(sessionId)).toEqual(before);
      fireEvent.click(screen.getByRole("button", { name }));
      fireEvent.click(await screen.findByRole("button", {
        name: en ? "Discard draft and start new" : "למחוק את הטיוטה ולהתחיל מחדש",
      }));
      await waitFor(() => expect(screen.queryByTestId("guest-flow-player")).toBeNull());
      await act(async () => { await Promise.resolve(); });
      expect(screen.getByRole("textbox")).toBeTruthy();
      expect(localStorage.getItem("pic:guest-repository:v1")).toBeNull();
      expect(root.sessionEngineStore.getSnapshot().gateTriggered).toBe(false);
    });
  }
}
