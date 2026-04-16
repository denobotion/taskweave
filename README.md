# taskweave

A declarative task runner that chains shell commands with typed inputs and conditional branching.

## Installation

```bash
npm install -g taskweave
```

## Usage

Define your tasks in a `taskweave.config.ts` file:

```typescript
import { defineConfig } from "taskweave";

export default defineConfig({
  tasks: {
    build: {
      steps: [
        { run: "tsc --noEmit" },
        { run: "esbuild src/index.ts --bundle --outdir=dist" },
      ],
    },
    deploy: {
      inputs: {
        env: { type: "string", choices: ["staging", "production"] },
      },
      steps: [
        { task: "build" },
        {
          run: "kubectl apply -f k8s/${env}",
          when: (ctx) => ctx.inputs.env === "production",
        },
      ],
    },
  },
});
```

Then run a task:

```bash
taskweave run deploy --env production
```

### Features

- **Typed inputs** — validate task arguments at runtime
- **Conditional branching** — skip or run steps based on context
- **Task chaining** — compose tasks from other tasks
- **Shell integration** — run any shell command with environment interpolation

## License

MIT © [taskweave contributors](https://github.com/taskweave/taskweave)