onBeforeUnmount(() => {
  if (colorModeStore.cleanup) {
    colorModeStore.cleanup();
  }
});
