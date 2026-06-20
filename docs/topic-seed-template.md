# Topic seed template — Pinnacle SSC Reasoning

Use this when copying topic metadata from the book's table of contents / index into [`src/data/pinnacle-reasoning.seed.ts`](../src/data/pinnacle-reasoning.seed.ts).

## What to copy from the book

For each chapter/topic in the index, note:

1. **Topic name** — exact chapter title (e.g. `Coding-Decoding`)
2. **Total questions** — question count shown for that chapter (e.g. `500`)

Do **not** copy answer keys into the seed file. Paste those later in the app under **Topics → [topic] → Answer Key**.

## Seed entry format

```typescript
{ name: "Coding-Decoding", totalQuestions: 500, startPage: 42, endPage: 58, answerKey: [] },
```

Optional fields:
- `startPage` — first page of this topic in the book
- `endPage` — last page of this topic in the book

Topics are linked to a book via `bookId` (set automatically for the default book on seed).

## Example from a book index

| Topic (from index)     | Questions |
|------------------------|-----------|
| Coding-Decoding        | 500       |
| Blood Relations        | 200       |
| Direction Sense        | 180       |

Becomes:

```typescript
export const PINNACLE_REASONING_TOPICS: TopicSeed[] = [
  { name: "Coding-Decoding", totalQuestions: 500, answerKey: [] },
  { name: "Blood Relations", totalQuestions: 200, answerKey: [] },
  { name: "Direction Sense", totalQuestions: 180, answerKey: [] },
  // ... repeat for all 35 topics
]
```

## Verify totals

After filling all topics, the sum of `totalQuestions` should match the book total (7222 for Pinnacle SSC Reasoning). The seed file exports `PINNACLE_TOTAL_QUESTIONS` for a quick check.

## Answer keys (in app)

Once topics are seeded, open each topic in the app and paste the answer key in either format:

**Continuous:** `ACBDABCD...`

**Numbered:**
```
1-A
2-C
3-B
```

The parser normalizes and validates length against `totalQuestions`.
