<script setup>
defineProps({ classId: { type: String, required: true } })
</script>

<template>
  <svg viewBox="0 0 48 48" fill="currentColor" aria-hidden="true" class="class-emblem">
    <g v-if="classId === 'hunter'"><path d="m8 8 16 10L40 8v7L24 25 8 15z"/><path d="m8 21 16 10 16-10v7L24 38 8 28z"/><path d="m15 34 9 6 9-6v5l-9 6-9-6z"/></g>
    <g v-else-if="classId === 'titan'"><path d="m8 4 11 7v13L8 17zM22 13l11-7v13l-11 7zM36 6l9 6v13l-9-6zM8 22l11 7v14L8 36zM22 31l11-7v13l-11 7zM36 24l9 6v13l-9-6z"/></g>
    <g v-else><path d="m4 10 11 7v23L4 33zM20 5l8 5v33l-8-5zM33 17l11-7v23l-11 7z"/></g>
  </svg>
</template>

<style scoped>
.class-emblem{width:38px;height:38px;flex-shrink:0}
</style>
