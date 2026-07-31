---
status: accepted
---

# `personal_treatment_library.protocol_content` is `jsonb`, not `text`

`treatments.structured_markdown` (the Pointer-side source `protocol_content` copies from on Lazy Flip,
per `decisions.md` DEC-016 §5) is `text` — raw Structured Markdown source. DEC-016 §5 itself never
specifies a data type for `protocol_content`; it only describes Pointer/Hard Copy ownership semantics.
This ticket's Hardening pass deliberately chose `jsonb` for `protocol_content` anyway, ahead of any
ticket actually implementing Lazy Flip.

This is a forward-looking choice, not one dictated by an existing decision record: it anticipates a Hard
Copy row storing the same parsed Atomic Unit JSON shape DEC-015's Content Parser produces for fast
retrieval ("converts existing HTML docs and future Markdown into JSON entries in the database, enabling
fast retrieval and consistent unit sequencing"), rather than re-parsing raw markdown on every read of an
EM's personalized copy.

**Consequence to flag for whoever implements Lazy Flip:** the copy-on-write step will need to convert
`treatments.structured_markdown` (`text`) into `personal_treatment_library.protocol_content`'s (`jsonb`)
shape at flip time — this is not a straight column copy. `protocol_content` remains `null` for every row
in this spike (Lazy Flip is explicitly out of scope), so the type mismatch has no live data impact yet.
