export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  assignee: string;
  due: string;
  tag: string;
}
export const names: Record<string, string> = {
  backlog: 'Backlog',
  todo: 'To do',
  progress: 'In progress',
  review: 'Review',
  done: 'Done',
};
export const people: Record<string, string> = {
  MC: 'Maya Chen',
  JL: 'Jamie Lee',
  AS: 'Alex Silva',
  NP: 'Nina Park',
};
export const initialColumns = ['backlog', 'todo', 'progress', 'review', 'done'];
const entry = (
  id: number,
  title: string,
  description: string,
  priority: Task['priority'],
  assignee: string,
  due: string,
  tag: string,
): Task => ({ id: `ORB-${id}`, title, description, priority, assignee, due, tag });
export const initialTasks: Readonly<Record<string, readonly Task[]>> = {
  backlog: [
    entry(
      101,
      'Explore command menu patterns',
      'Map the actions our teams reach for most. Start with navigation, then quick creation.',
      'Low',
      'AS',
      '2026-11-04',
      'Research',
    ),
    entry(
      102,
      'Design a better empty state',
      'Give new workspaces a useful first step and a little personality.',
      'Medium',
      'NP',
      '2026-11-03',
      'Design',
    ),
  ],
  todo: [
    entry(
      103,
      'Build the notification center',
      'Group updates by project and let people control the signal.',
      'High',
      'MC',
      '2026-10-29',
      'Feature',
    ),
    entry(
      104,
      'Audit keyboard navigation',
      'Make every core workflow possible from the keyboard.',
      'High',
      'JL',
      '2026-10-30',
      'Accessibility',
    ),
    entry(
      105,
      'Write onboarding microcopy',
      'Short, clear prompts for the first five minutes.',
      'Low',
      'NP',
      '2026-11-02',
      'Content',
    ),
  ],
  progress: [
    entry(
      106,
      'A home for every project',
      'Bring milestones, activity and the people behind the work into one thoughtful overview.',
      'High',
      'MC',
      '2026-10-28',
      'Feature',
    ),
    entry(
      107,
      'Refine the color system',
      'Check semantic tokens in light, dark and high contrast.',
      'Medium',
      'AS',
      '2026-10-29',
      'Design',
    ),
  ],
  review: [
    entry(
      108,
      'Invite your team, effortlessly',
      'A simpler invitation flow, with clearer roles and fewer steps.',
      'Medium',
      'JL',
      '2026-10-27',
      'Feature',
    ),
  ],
  done: [
    entry(
      109,
      'Ship the new task editor',
      'Fast editing, sensible defaults and room for the details.',
      'Medium',
      'NP',
      '2026-10-26',
      'Feature',
    ),
    entry(
      110,
      'Make search feel instant',
      'Find tasks by title, identifier or description.',
      'Low',
      'MC',
      '2026-10-25',
      'Performance',
    ),
  ],
};
export interface BoardState {
  columns: readonly string[];
  tasks: Readonly<Record<string, readonly Task[]>>;
}
export function loadBoard(): BoardState {
  try {
    const saved = JSON.parse(
      localStorage.getItem('vibednd:orbit:v1') ?? 'null',
    ) as BoardState | null;
    if (
      saved &&
      Array.isArray(saved.columns) &&
      saved.columns.length === 5 &&
      new Set(saved.columns).size === 5 &&
      saved.columns.every((id) => initialColumns.includes(id)) &&
      saved.tasks &&
      saved.columns.every((id) => Array.isArray(saved.tasks[id]))
    ) {
      const tasks = Object.values(saved.tasks).flat();
      if (
        tasks.every(
          (task) =>
            typeof task.id === 'string' &&
            typeof task.title === 'string' &&
            typeof task.description === 'string' &&
            ['High', 'Medium', 'Low'].includes(task.priority) &&
            typeof task.assignee === 'string' &&
            typeof task.due === 'string' &&
            typeof task.tag === 'string',
        ) &&
        new Set(tasks.map((t) => t.id)).size === tasks.length
      )
        return saved;
    }
  } catch {
    /* Corrupted demo storage falls back to sample data. */
  }
  return { columns: initialColumns, tasks: initialTasks };
}
