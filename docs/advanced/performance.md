# Performance

Registration remains stable for data/disabled/index updates. Managers are not recreated for reactive options. A context owns one DOM disconnection observer. VibeDND updates application-facing state at start, target changes and end; pointer motion and geometry stay inside the engine.

Run pnpm bench for real browser measurements at 100, 500 and 1,000 items, plus a 20-column board. Results include registration/load time, actual drag durations, long animation frames where available and repeated cancellations/transfers. The machine/browser and exact scenario are recorded in benchmarks/results.json. There is no fabricated FPS target.

Very large nonvirtual boards still register and measure real DOM entities. Use the measurements to decide whether pagination or a verified virtualization integration is appropriate. A callback that traverses an entire application store on every dragover can dominate library overhead.
