(function startSidepanelCompat(globalScope) {
  const bootstrap = globalScope.SidepanelBootstrap?.createSidepanelApp;
  if (typeof bootstrap !== 'function') {
    throw new Error('SidepanelBootstrap.createSidepanelApp is unavailable.');
  }
  bootstrap({
    chromeApi: globalScope.chrome,
    document: globalScope.document,
    window: globalScope,
  }).start().catch((error) => {
    console.error('Failed to bootstrap sidepanel:', error);
  });
})(window);
