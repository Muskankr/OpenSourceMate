# Issue difficulty estimates

Issue search and recommendations include `difficulty` and `difficulty_reason`. The UI displays the estimate with its reason. Earlier API responses and demo data still use the existing label fallback.

The estimator reads public issue metadata already returned by GitHub. Explicit beginner, intermediate, and advanced labels take precedence. When those labels disagree, the higher level is used. Otherwise, starter labels, documentation scope, complex keywords, body length, comment count, cited files, and pull request URLs in the issue body inform a heuristic estimate. Missing metadata defaults to Intermediate. There are no extra GitHub requests or AI calls.

Long descriptions and many comments can reflect a detailed report for a small fix. Sparse reports can also conceal complex work. Use the reason to judge scope before requesting an assignment.

## Manual review

Read 30 public GitHub issues selected from the repository's [difficulty dataset](../data/issue-difficulty-labels.csv), using rows 1, 3, 6, 8, 11, 13, 16, 18, 21, and 24 within each dataset category. On November 23, 2026, I read the current reports and wrote an effort judgment before comparing the estimate. The sample includes 14 open and 16 closed issues from the original dataset. This is a small spot check on a known dataset sample.

Exact agreement was **19/30**. By manual level, the estimator matched 8/10 Beginner, 7/10 Intermediate, and 4/10 Advanced examples. The original dataset uses Hard for its highest level.

| Issue | Manual assessment | Estimated | Scope reviewed |
| --- | --- | --- | --- |
| [cli/cli#10038](https://github.com/cli/cli/issues/10038) | Beginner | Beginner | Change branch delimiters in localized output paths. |
| [cli/cli#10084](https://github.com/cli/cli/issues/10084) | Beginner | Beginner | Bump an action used by Go extension templates. |
| [freeCodeCamp/freeCodeCamp#71565](https://github.com/freeCodeCamp/freeCodeCamp/issues/71565) | Beginner | Intermediate | Disambiguate wording in two existing quiz questions. |
| [JabRef/jabref#17459](https://github.com/JabRef/jabref/issues/17459) | Beginner | Beginner | Reuse numeric sorting for one table column. |
| [JabRef/jabref#17572](https://github.com/JabRef/jabref/issues/17572) | Beginner | Beginner | Supply effective-directory placeholders for three existing inputs. |
| [pandas-dev/pandas#62923](https://github.com/pandas-dev/pandas/issues/62923) | Beginner | Beginner | Update an optional type in the parameter documentation. |
| [pytest-dev/pytest#13638](https://github.com/pytest-dev/pytest/issues/13638) | Beginner | Beginner | Replace a deprecated command in one release script. |
| [scikit-learn/scikit-learn#30766](https://github.com/scikit-learn/scikit-learn/issues/30766) | Beginner | Beginner | Replace the package's deprecated license metadata. |
| [scikit-learn/scikit-learn#32462](https://github.com/scikit-learn/scikit-learn/issues/32462) | Beginner | Beginner | Use the existing parameter name in a docstring. |
| [vitejs/vite#17580](https://github.com/vitejs/vite/issues/17580) | Beginner | Intermediate | Add boolean to an existing compatibility type. |
| [cli/cli#12823](https://github.com/cli/cli/issues/12823) | Intermediate | Intermediate | Consolidate shared error behavior across two query paths. |
| [cli/cli#13066](https://github.com/cli/cli/issues/13066) | Intermediate | Intermediate | Change the 401 hint while retaining other login guidance. |
| [cli/cli#15053](https://github.com/cli/cli/issues/15053) | Intermediate | Intermediate | Distinguish HTTP 409 causes in workflow cancellation. |
| [freeCodeCamp/freeCodeCamp#71609](https://github.com/freeCodeCamp/freeCodeCamp/issues/71609) | Intermediate | Intermediate | Adjust a workshop prerequisite while preserving curriculum order. |
| [pandas-dev/pandas#72087](https://github.com/pandas-dev/pandas/issues/72087) | Intermediate | Intermediate | Preserve the Series index through nullable dummy creation. |
| [pytest-dev/pytest#14853](https://github.com/pytest-dev/pytest/issues/14853) | Intermediate | Beginner | Expose a stable type for an existing fixture API. |
| [rust-lang/rust-clippy#16156](https://github.com/rust-lang/rust-clippy/issues/16156) | Intermediate | Intermediate | Add a bounded lint pattern and regression cases. |
| [rust-lang/rust-clippy#17939](https://github.com/rust-lang/rust-clippy/issues/17939) | Intermediate | Beginner | Extend an existing collection lint to VecDeque. |
| [rust-lang/rust-clippy#18053](https://github.com/rust-lang/rust-clippy/issues/18053) | Intermediate | Intermediate | Account for conditional compilation in a lint transform. |
| [vitejs/vite#2363](https://github.com/vitejs/vite/issues/2363) | Intermediate | Beginner | Surface diagnostic origins in the existing build pipeline. |
| [cli/cli#14989](https://github.com/cli/cli/issues/14989) | Advanced | Intermediate | Handle a disappearing record across paginated requests. |
| [pandas-dev/pandas#62915](https://github.com/pandas-dev/pandas/issues/62915) | Advanced | Intermediate | Reason about timezone semantics at a DST boundary. |
| [pandas-dev/pandas#72094](https://github.com/pandas-dev/pandas/issues/72094) | Advanced | Intermediate | Preserve missing-value semantics during indexed mapping. |
| [pytest-dev/pytest#13809](https://github.com/pytest-dev/pytest/issues/13809) | Advanced | Intermediate | Adapt test execution to sub-interpreter lifecycle constraints. |
| [pytest-dev/pytest#14775](https://github.com/pytest-dev/pytest/issues/14775) | Advanced | Intermediate | Trace fixture internals through warning promotion and teardown. |
| [rust-lang/rust-clippy#15577](https://github.com/rust-lang/rust-clippy/issues/15577) | Advanced | Advanced | Handle borrow lifetimes when suggesting a compiler edit. |
| [rust-lang/rust-clippy#17637](https://github.com/rust-lang/rust-clippy/issues/17637) | Advanced | Advanced | Analyze aliasing to identify redundant clones. |
| [scikit-learn/scikit-learn#31554](https://github.com/scikit-learn/scikit-learn/issues/31554) | Advanced | Intermediate | Define streaming behavior for metrics with differing aggregation rules. |
| [vitejs/vite#23195](https://github.com/vitejs/vite/issues/23195) | Advanced | Advanced | Preserve base-path semantics through sourcemap transformations. |
| [vitejs/vite#9948](https://github.com/vitejs/vite/issues/9948) | Advanced | Advanced | Resolve dependencies correctly across a monorepo module graph. |
