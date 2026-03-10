# Contributing to Waves

Thank you for your interest in contributing. Here's how to get started.

## Development Setup

```bash
git clone https://github.com/your-username/waves.git
cd waves
npm install
npm run dev
```

## Pull Request Process

1. **Branch** - Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature
   ```

2. **Code** - Write code that follows existing style. Run lint before committing:
   ```bash
   npm run lint
   ```

3. **Commit** - Use clear commit messages:
   ```
   feat: add new visualization mode
   fix: correct fullscreen layout on mobile
   ```

4. **Push** - Push your branch and open a Pull Request against `main`.

5. **Review** - Address any feedback. Once approved, your PR will be merged.

## Code Standards

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Keep components focused and readable
- Run `npm run lint` and fix reported issues

## Questions

Open an Issue for questions or discussion.
