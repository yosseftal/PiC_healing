# Wave 13 remaining execution plan

**Start checkpoint:** 6a28ed5; W13-01 closed and verified.
**Authorization:** user requested continuous execution of W13-02 through W13-09, with independent DAG branches permitted.

## Model and ownership selection

| Work | Selected model class | Reason |
| --- | --- | --- |
| W13-02 and W13-03 | gpt-6-astra, high reasoning | Atomic storage, concurrency and frozen promotion replay |
| W13-04 | High-capability reasoning model | Draft lifetime, reversible navigation and ownership recovery |
| W13-05 and W13-06 | gpt-6-luna, high reasoning | Bounded presentation with targeted identity/focus tests |
| W13-07 | Efficient UI/content model, with source review | Approved content, accessible external video and return flow |
| W13-08 | Efficient model; escalate if domain behavior changes | Diagnose and correct routing while preserving content |
| W13-09 | High-capability reasoning model | Assemble persistence, identity, bilingual and failure journeys |
| Targeted test/debug tasks | Efficient model or direct runner | Short feedback loop; retain stronger review for semantic fixes |

Only callable supported models are selected. Each dispatch re-evaluates the actual problem and its risk.
Independent reviews remain separate from implementation context.

## Active frontier

- W13-02: closed after confirmed SQL application and full real verification: 64 files / 632 passing tests.
- W13-06: completed and verified as an independent branch during W13-02 architecture/SQL preparation.
- W13-03 is the current frontier; start only after the verified W13-02 closure commit.
- No simultaneous writers to composition-root, dictionaries, context hooks or tests.
- W13-02 web controls follow the agreed contract and preserve the completed W13-06 identity presentation.
- W13-08 may be dispatched independently when source ownership and verification runners are available.

After quota interruptions, finishing/debug verification used gpt-6.1-sol with high reasoning in fresh owned contexts.
The bounded Guest public-lock tests used gpt-6-luna with high reasoning; both final review axes used gpt-6.1-sol.
Resume from `../handoffs/w13-02-verified-and-w13-03-entry.md`; the original manual checkpoint remains as history.

## W13-02 seam decisions to preserve

The shared group mutation revision must cover order, membership, ratings and joint-answer writes.
An order-only counter cannot prevent an append from overwriting a rating read before that rating committed.
Reads must pair the token with a coherent ordered group projection; two unrelated selects are insufficient.
Reorder validates exact current membership and ownership in one atomic operation.

The current blind aggregate save removes omitted members and is unsafe for this wave.
The approved resolution is an atomic checked save that rejects omitted members and implicit permutations,
while preserving ordinary field/rating/joint updates and append semantics. Explicit reorder owns order changes.
No shipped GroupEngine removal caller requires retaining destructive replacement behavior.
Legacy callers must fail safely rather than silently erase newer ordering or membership.

New promotion behavior must be distinguishable from frozen legacy requests. Do not enrich or rewrite an existing
frozen request while reusing its idempotency key. Preserve old receipt/fingerprint equality and completion count.

## Migration and gates

Prepare reviewable additive SQL and failing contract evidence before the established manual application checkpoint.
Do not alter live privileges, schema or data during architecture discovery.
The Supabase testing guide requires human SQL Editor application and confirmation before green migration verification.
Any required rollout restrictions on old direct writers must be explicit in the migration review.

User permission covers cleanup only of fixture/Auth UUIDs created by the same test run, including test treatments.
Preexisting data, treatment files and historical documentation remain protected.
Use normal TLS, two test workers and sequential heavy runners. Never waive a failed test or unavailable manual result.
Close each complete ticket only with DoD evidence and its scoped commit; otherwise keep an honest in-progress checkpoint.
