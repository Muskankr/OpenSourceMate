# Issue difficulty labelling guidelines

This guide explains how to label GitHub issues in
[`data/issue-difficulty-labels.csv`](../data/issue-difficulty-labels.csv). The dataset gives the difficulty
estimator (#27) real examples to design and test against. Follow these rules so that two contributors
labelling the same issue choose the same level.

## The question to answer

> How much work would a capable developer who is **new to this project** need to resolve this issue?

Label the work, not the topic and not the project's own label. A `good first issue` can still be
intermediate, and a short title can still hide hard work. Write down what you see in the issue. Do not
guess from what a maintainer might decide later.

## Levels

### beginner

Most of these apply:

- The change is in one file or a few nearby lines, and the issue names the location or it is easy to find.
- No design decision is needed. The expected result is stated.
- Typical work: a typo, a docstring or docs page, a wording change, a config or version bump, adding a
  value to an existing list or enum, an alias, a one-line validation.
- You can verify it without a special setup, such as a cluster, an organisation account or a specific OS.

### intermediate

Most of these apply:

- You need to read and understand one module or subsystem before changing it.
- The fix touches several files or adds a new code path, and it needs new tests.
- There is a small design choice, such as error vs warning, or which output format to use, but the
  direction is mostly clear.
- Typical work: a bug with a clear repro inside one component, a refactor that removes duplication, a new
  lint or flag that follows existing patterns, deprecation work that follows a written policy.

### hard

Any of these is usually enough:

- The bug sits in core internals: parsers, resolvers, type or lifetime checks, index engines, concurrency
  or pagination races.
- It is a regression or an edge case that needs deep domain knowledge, such as timezones, sourcemaps,
  Array API or numeric dtypes.
- It needs an API or architecture decision, or is open-ended ("Needs Investigation", a new feature that
  spans many modules).
- It is hard to reproduce, or has stayed open with long discussion and no agreed fix.
- The project itself marks it as hard (`E-hard`, `Hard`).

## Tie-breakers

1. **Between two levels, pick the higher one** if the issue has no clear fix described.
2. **Project labels are evidence, not the answer.** If you disagree with `good first issue` or `E-medium`,
   use your level and say why in the reason.
3. **The comment count is a signal, not a rule.** Many comments often mean disagreement or a hard bug. On
   meta-issues they can also mean many people each did a small part.
4. **Meta-issues split into small tasks** (for example "one PR per file") are labelled by the size of one
   task.
5. **Skip issues that are not tasks**, such as questions, discussions, bot reports and duplicates.

## Writing the reason

- One sentence, in plain English, under about 120 characters.
- Say **what makes it that level**: the size of the change, the knowledge needed or the decision needed.
  For example: "Add one allowed value to an existing --status flag that the API already supports."
- Do not repeat the title.

## CSV format

| Column          | Content                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| `issue_url`     | Full `https://github.com/<owner>/<repo>/issues/<n>` URL. Must be unique.        |
| `title`         | Issue title as it was when collected.                                           |
| `repository`    | `owner/repo`.                                                                   |
| `language`      | Primary language of the repository as GitHub reports it.                        |
| `labels`        | The issue's labels, separated by `; `, copied as-is (including emoji labels).   |
| `comment_count` | Number of comments when collected.                                              |
| `difficulty`    | `beginner`, `intermediate` or `hard`.                                           |
| `reason`        | One-line reason, as described above.                                            |
| `labelled_by`   | GitHub username of the person who chose the label.                              |
| `reviewed_by`   | Username of a **different** person who checked the label. Empty until reviewed. |
| `collected_on`  | Date the title, labels and comment count were read (`YYYY-MM-DD`).              |

Rows are sorted by difficulty, then repository, then URL. Use a CSV library to write the file so that
commas and quotes in titles are escaped correctly.

## Adding issues

- Pick projects that welcome new contributors: they have a contributing guide and use labels like
  `good first issue` or `help wanted`.
- Keep the levels roughly balanced and include at least four languages.
- Include open issues only, so the estimator is tested on the kind of issue it will see.
- Fill every column except `reviewed_by`.

## Reviewing

1. Read the issue on GitHub, not just the title in the CSV.
2. Choose your own level **before** you look at the existing one.
3. If you agree, put your username in `reviewed_by`.
4. If you disagree, discuss it in the pull request. When you agree on a level, update `difficulty` and
   `reason`, then fill in `reviewed_by`. If you cannot agree, use the higher level (tie-breaker 1).
5. A reviewer must not review their own rows.

## Checking the file

```bash
python scripts/validate_issue_difficulty_labels.py
```

The script checks the columns, the URL format, duplicate URLs, the allowed difficulty values and that
`reviewed_by` differs from `labelled_by`. Add `--require-review` to also fail on rows that have not been
reviewed yet.
