import { FakeRepositoryPort } from "../fakes/fake-repository-port";
import { runGroupOrderContract } from "./group-order.contract";

runGroupOrderContract(() => {
  const port = new FakeRepositoryPort();
  return { port, fresh: () => port };
});
