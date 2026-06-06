(function () {
  function downloadTextFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function setupDownloadButton(buttonId, textareaId, filename, type) {
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    btn.onclick = () => {
      const el = document.getElementById(textareaId);
      if (!el || !el.value) return;

      downloadTextFile(filename, el.value, type);

      const originalText = btn.innerText;
      btn.innerText = 'ダウンロード完了';
      btn.classList.add('downloaded');
      setTimeout(() => {
        btn.innerText = originalText;
        btn.classList.remove('downloaded');
      }, 2000);
    };
  }

  window.MikasaExport = {
    setupDownloadButton
  };
})();
