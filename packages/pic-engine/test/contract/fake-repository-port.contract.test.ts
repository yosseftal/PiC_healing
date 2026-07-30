import { FakeRepositoryPort } from "../fakes/fake-repository-port";
import { runRepositoryPortContractTests } from "./repository-port.contract";

/**
 * Ticket 03: run the shared, adapter-agnostic `RepositoryPort` contract suite once against
 * `FakeRepositoryPort`, in this package. Tickets 10 and 13 import `runRepositoryPortContractTests`
 * unmodified and call it here with their own real adapter's `makePort` factory instead.
 */
runRepositoryPortContractTests(() => new FakeRepositoryPort());
