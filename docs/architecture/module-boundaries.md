# Module Boundaries

## Source modules

| Path                             | Responsibility                                                                          | Must not drift into                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/index.ts`                   | Vite hooks, orchestration, pipeline assembly, composition analysis, final serialization | becoming the home for every helper or duplicating utility logic already covered elsewhere |
| `src/module-contract.ts`         | Versioned `KoppaModule` contract and validation helper                                  | ad hoc business logic unrelated to the emitted shape                                      |
| `src/transpileToJs.ts`           | TS -> JS transpilation and sourcemap extraction                                         | Vite resolution, template parsing, or contract serialization                              |
| `src/transpileToCss.ts`          | SCSS/SASS -> CSS compilation and prefixing utilities                                    | file IO or dependency resolution                                                          |
| `src/utils/extractImports.ts`    | static import extraction, duplicate detection, dependency loader code generation        | direct Vite plugin hook behavior                                                          |
| `src/utils/injectStructIds.ts`   | deterministic template attribute injection                                              | DOM runtime behavior or non-template parsing                                              |
| `src/utils/structId.ts`          | deterministic struct-id seed and counter generation                                     | template parsing or output serialization                                                  |
| `src/utils/identityConstants.ts` | shared structural identity constants                                                    | feature logic                                                                             |

## Test boundaries

| Path pattern              | Responsibility                                       |
| ------------------------- | ---------------------------------------------------- |
| `test/*Imports*.test.ts`  | import extraction and dependency generation behavior |
| `test/*struct*.test.ts`   | struct-id generation and template injection          |
| `test/*contract*.test.ts` | emitted contract compatibility                       |
| `test/plugin*.test.ts`    | plugin wrapper and end-to-end transform behavior     |

## Boundary rules

- Keep Vite-specific behavior at the package edge.
- Keep compiler and parser helpers independently testable.
- Add a new module when a new invariant appears; do not bury it in comments.
- If a utility starts requiring file-system access, dependency resolution, or
  environment state, reconsider whether it still belongs in `src/utils/`.
