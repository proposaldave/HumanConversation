(() => {
  const base = window.location.hostname === 'proposaldave.github.io' ? '/HumanConversation/' : '/'
  window.location.replace(`${base}?fresh=${Date.now()}`)
})()
