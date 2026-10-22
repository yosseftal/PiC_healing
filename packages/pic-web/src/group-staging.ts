import type { RepositoryPort, SymptomGroup } from "pic-engine";

/** Only GroupEngine uses this decorator. An exclusive composition operation owns each staging window. */
export function createGroupStaging(port: RepositoryPort) {
  let staged: Map<string, SymptomGroup> | null = null;
  const decorated = new Proxy(port, {
    get(target, property, receiver) {
      if (property === "getGroup") return async (id: string) => {
        if (staged !== null) return structuredClone(staged.get(id) ?? null);
        return target.getGroup(id);
      };
      if (property === "saveGroup") return async (group: SymptomGroup) => {
        if (staged !== null) { staged.set(group.id, structuredClone(group)); return; }
        return target.saveGroup(group);
      };
      const value: unknown = Reflect.get(target, property, receiver);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
  return {
    port: decorated,
    async build(operation: () => Promise<string>): Promise<SymptomGroup> {
      if (staged !== null) throw new Error("A group is already being prepared");
      const draft = new Map<string, SymptomGroup>();
      staged = draft;
      try {
        const id = await operation();
        const group = draft.get(id);
        if (!group || draft.size !== 1) throw new Error("Expected one prepared group");
        return structuredClone(group);
      } finally { staged = null; }
    },
  };
}
