onBeforeUnmount(() => {
  // 可选的清理逻辑
  if (colorModeStore.cleanup) {
    colorModeStore.cleanup();
  }
});
