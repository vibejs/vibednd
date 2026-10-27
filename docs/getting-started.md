# Getting started

VibeDND is a headless drag-and-drop adapter for Vibe.js 0.1. It uses modern dnd-kit DOM 0.5.1, with pointer and keyboard sensors, accessibility announcements and auto-scrolling enabled by default.

## Installation

```sh
pnpm add @usevibejs/dnd @usevibejs/ui
```

This repository is not published by the development workflow. Before an npm release, build and install its local tarball using pnpm pack. A consumer also needs matching @usevibejs/compiler and @usevibejs/ui versions.

## Quick start

Create a context in the list's setup. Pass that context explicitly to composables called in the same setup; descendants receive it through injection. Keep a stable key for every rendered item.

```vibe
<script setup lang="ts">
import { useDnd, useSortableList } from '@usevibejs/dnd';
import Item from './Item.vibe';
const context = useDnd();
const { items } = useSortableList({
  items: ['Design', 'Build', 'Review'],
  getId: item => item,
  context,
});
</script>
<template>
  <ul>
    <Item v-for="(item,index) in items" :key="item" :id="item" :index="index" />
  </ul>
</template>
```

Item.vibe registers its real element and handle; it creates no wrapper around your markup.

```vibe
<script setup lang="ts">
import { useTemplateRef } from '@usevibejs/ui';
import { useSortable } from '@usevibejs/dnd';
const props = defineProps<{ id: string; index: number }>();
const element = useTemplateRef<HTMLElement>('element');
const handle = useTemplateRef<HTMLButtonElement>('handle');
const drag = useSortable({
  id: () => props.id,
  index: () => props.index,
  group: 'list',
  element,
  handle,
});
</script>
<template>
  <li ref="element" :data-over="drag.isOver.value">
    <button ref="handle" type="button" :aria-label="'Move '+id" style="touch-action:none">⠿</button>
    {{ id }}
  </li>
</template>
```

The engine moves a separate inert text overlay. The application array changes once, on accepted drop. A canceled drag leaves the array unchanged. A context made by useDnd is disposed with its component scope.
