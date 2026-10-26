import { FakeRepositoryPort } from "../fakes/fake-repository-port";
import { runMembershipRevisionContract } from "./membership-revision.contract";
runMembershipRevisionContract(() => { const port = new FakeRepositoryPort(); return { port, fresh: () => port }; });
