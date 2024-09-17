# Portfolio: React + TypeScript + Vite

Welcome to my personal portfolio project built using modern web technologies such as React, TypeScript, and Vite. This setup enables a fast, modular, and scalable environment perfect for showcasing my skills and projects.

## Key Features

- **React + TypeScript**: A strong combination for building scalable front-end applications with type safety.
- **Vite**: A fast development server that ensures hot module reloading and smooth development experience.
- **ESLint Integration**: Ensures code quality and consistency throughout the project.
- **Tailwind CSS**: A utility-first CSS framework that allows for rapid development with a fully customizable design system.
- **Framer Motion**: A production-ready motion library for React that allows for easy creation of animations and gestures.

## Project Setup

This project leverages Vite for development and bundling, and ESLint for linting, with additional plugins and configurations for React and TypeScript support.

### ESLint Configuration

To maintain code quality, I've extended the default ESLint setup to include type-aware linting rules and stylistic rules specifically tailored for React with TypeScript. Below are some key ESLint settings:

- **Type-Aware Rules**: The configuration includes rules that are aware of TypeScript types, improving the overall reliability of the codebase.
- **React Plugin**: The project integrates `eslint-plugin-react` to apply recommended rules for React projects.

### Recommended ESLint Configuration

For production applications, I recommend enabling type-aware lint rules for better code reliability:

1. Configure the top-level `parserOptions` in the ESLint configuration:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```
