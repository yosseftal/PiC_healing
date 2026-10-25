import { runGroupOrderContract } from "pic-engine/test/contract/group-order.contract";
import { LocalGuestRepository } from "./index";

runGroupOrderContract(() => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  return { port: new LocalGuestRepository({ storage }), fresh: () => new LocalGuestRepository({ storage }) };
});
