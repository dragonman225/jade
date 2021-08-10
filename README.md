- An Electron app has two processes, _main_ and _renderer_, so there are `src/electron-main.ts` and `src/electron-renderer.ts` two entries for the two processes respectively. A Web app only has `src/web-index.ts` one entry.

- `src/resources` directory: Any Electron-specific or Web-specific parts are considered resources. They should be put here and use dependency injection to inject available ones into Electron and Web entries.

- `npx browserslist@latest --update-db` updates caniuse-lite version in your **npm, yarn or pnpm lock file**.
  - Source: [Browsers Data Updating](https://github.com/browserslist/browserslist#browsers-data-updating)
