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

  function setupExportTabs() {
    const tabButtons = document.querySelectorAll('.export-tab-btn');
    const tabContents = document.querySelectorAll('.export-tab-content');

    tabButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        const content = document.getElementById(`export-${format}-content`);
        if (!content) return;

        tabButtons.forEach((button) => button.classList.remove('active'));
        tabContents.forEach((tabContent) => tabContent.classList.remove('active'));

        btn.classList.add('active');
        content.classList.add('active');
      });
    });
  }

  window.MikasaExport = {
    setupDownloadButton,
    setupExportTabs
  };
})();
