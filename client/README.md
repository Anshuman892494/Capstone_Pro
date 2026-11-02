# React + Vite

## Marketplace category navigation

The homepage category strip uses `CategoryScrollBar` for horizontal navigation.
Translucent orange-accented arrow buttons appear only where more categories are
available. Native touch/trackpad scrolling remains available, keyboard users can
activate the labelled buttons, and reduced-motion preferences disable smooth
scrolling. ResizeObserver updates the arrows when categories load or the viewport
changes. No backend, authentication or data-access behavior changes.

Browser regression check (from the repository root, with the client on port 5173):

```bash
npx --yes --package @playwright/cli playwright-cli -s=category-check open http://127.0.0.1:5173/
npx --yes --package @playwright/cli playwright-cli -s=category-check run-code --filename client/tests/category-scroll.playwright.js
```

The check uses local API fixtures and covers desktop/mobile edges, keyboard
activation, category selection and a viewport with no overflow.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
