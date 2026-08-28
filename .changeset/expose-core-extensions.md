---
'@mirasen/react-chessboard': minor
---

Expose board handle via ref and add `checkSquare` convenience prop.

- `Chessboard` is now a `forwardRef` component. `ref.current` resolves to a `ChessboardHandle` — the full public surface of the underlying `@mirasen/chessboard` board instance, including all extensions and runtime methods. Future core extensions are accessible via `ref.current.extensions.<id>` without any wrapper changes.
- New `checkSquare` prop (`SquareString | null`) — declaratively highlights the king's square when in check, delegating to the core `check` extension.
- `ChessboardHandle` and `SquareString` are now exported from the package index.
- Bumped `@mirasen/chessboard` minimum to `^1.4.0` (adds the `check` extension).
