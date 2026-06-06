// ── Layer catalog (bundled from gsi-layers.js) ────────────────────────────
(function () {
  const DEFAULT_LAYER_KEYS = {
    old: 'photo1974',
    new: 'osm'
  };

  const BASE_LAYERS = [
    { key: 'standard',   title: '標準地図（国土地理院）',   url: 'https://maps.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',   attribution: '&copy; <a href="https://maps.gsi.go.jp/" target="_blank">国土地理院</a>', minZoom: 2, maxZoom: 18 },
    { key: 'pale',       title: '淡色地図（国土地理院）',   url: 'https://maps.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',  attribution: '&copy; <a href="https://maps.gsi.go.jp/" target="_blank">国土地理院</a>', minZoom: 2, maxZoom: 18 },
    { key: 'osm',        title: 'OpenStreetMap',             url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',    attribution: '&copy; OpenStreetMap contributors', minZoom: 2, maxZoom: 19, maxNativeZoom: 19 },
    { key: 'cartoLight', title: 'CARTO Positron',            url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap contributors &copy; CARTO', minZoom: 2, maxZoom: 20, maxNativeZoom: 20 },
    { key: 'topo',       title: 'OpenTopoMap',               url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors, SRTM | OpenTopoMap (CC-BY-SA)', minZoom: 2, maxZoom: 17, maxNativeZoom: 17 }
  ];

  const LAYER_GROUPS = [
    {
      label: '年代別の写真',
      layers: [
        { key: 'photo1928',        title: '1928年頃',               url: 'https://maps.gsi.go.jp/xyz/ort_1928/{z}/{x}/{y}.png',        minZoom: 2,  maxZoom: 18, maxNativeZoom: 18 },
        { key: 'photo1936',        title: '1936年-1942年頃',         url: 'https://maps.gsi.go.jp/xyz/ort_riku10/{z}/{x}/{y}.png',      minZoom: 2,  maxZoom: 18, maxNativeZoom: 18 },
        { key: 'photo1945',        title: '1945年-1950年',              url: 'https://maps.gsi.go.jp/xyz/ort_USA10/{z}/{x}/{y}.png',       minZoom: 2,  maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1961',        title: '1961年-1969年',              url: 'https://maps.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png',       minZoom: 2,  maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1974',        title: '1974年-1978年',              url: 'https://maps.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg',           minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1979',        title: '1979年-1983年',              url: 'https://maps.gsi.go.jp/xyz/gazo2/{z}/{x}/{y}.jpg',           minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1984',        title: '1984年-1986年',              url: 'https://maps.gsi.go.jp/xyz/gazo3/{z}/{x}/{y}.jpg',           minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1987',        title: '1987年-1990年',              url: 'https://maps.gsi.go.jp/xyz/gazo4/{z}/{x}/{y}.jpg',           minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo2007',        title: '2007年',                   url: 'https://maps.gsi.go.jp/xyz/nendophoto2007/{z}/{x}/{y}.png',   minZoom: 14, maxZoom: 18 },
        { key: 'seamlessTimeline', title: '時系列表示（ZL14以上）',   url: 'https://maps.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',   minZoom: 14, maxZoom: 18 },
        { key: 'seamless',         title: '全国最新写真（シームレス）',   url: 'https://maps.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',   minZoom: 2,  maxZoom: 18 }
      ]
    }
  ];

  window.MikasaLayerCatalog = {
    baseLayers: BASE_LAYERS,
    defaultLayerKeys: DEFAULT_LAYER_KEYS,
    layerGroups: LAYER_GROUPS,
    allLayers: BASE_LAYERS.concat(LAYER_GROUPS.reduce((layers, group) => layers.concat(group.layers), []))
  };
})();

// ── Export utilities (bundled from export-utils.js) ────────────────────────
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
      setTimeout(() => { btn.innerText = originalText; btn.classList.remove('downloaded'); }, 2000);
    };
  }

  window.MikasaExport = { setupDownloadButton };
})();

// ── Main application ────────────────────────────────────────────────────────
(function () {
  function setupAccordionJumpButtons() {
    document.querySelectorAll('[data-open-accordion]').forEach((button) => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-open-accordion');
        const target = targetId ? document.getElementById(targetId) : null;
        if (!target) return;

        if (target.tagName.toLowerCase() === 'details') {
          target.open = true;
        }
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  setupAccordionJumpButtons();

  function setLayerSwitcherMessage(message) {
    ['switcher-old', 'switcher-new'].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      el.innerHTML = '';
      const option = document.createElement('option');
      option.textContent = message;
      el.appendChild(option);
      el.disabled = true;
    });
  }

  if (!window.L) {
    setLayerSwitcherMessage('地図ライブラリの読み込みに失敗しました');
    return;
  }

  if (!window.MikasaLayerCatalog) {
    setLayerSwitcherMessage('地図レイヤーの読み込みに失敗しました');
    return;
  }

  if (!window.MikasaExport) {
    setLayerSwitcherMessage('地図ツールの読み込みに失敗しました');
    return;
  }

  const MAP_CONFIG = {
    old: { id: 'map-old', maxZoom: 18 },
    current: { id: 'map-new', maxZoom: 18 }
  };
  const MAP_ZOOM_LIMITS = {
    min: 2,
    max: 18
  };
  const DEFAULT_VIEW = { center: [35.685, 139.7527], zoom: 14 };
  const LAYER_CATALOG = window.MikasaLayerCatalog;
  const EXPORT_TOOLS = window.MikasaExport;
  const DEFAULT_LAYER_KEYS = LAYER_CATALOG.defaultLayerKeys;
  const FALLBACK_LAYER_KEYS = {
    old: 'standard',
    new: 'osm'
  };

  const oldMap = L.map(MAP_CONFIG.old.id, { zoomControl: false, preferCanvas: true, minZoom: MAP_ZOOM_LIMITS.min, maxZoom: MAP_CONFIG.old.maxZoom });
  const newMap = L.map(MAP_CONFIG.current.id, { zoomControl: false, preferCanvas: true, minZoom: MAP_ZOOM_LIMITS.min, maxZoom: MAP_CONFIG.current.maxZoom });
  const maps = { old: oldMap, current: newMap, new: newMap };

  oldMap.createPane('labelPane');
  oldMap.getPane('labelPane').style.zIndex = '650';
  newMap.createPane('labelPane');
  newMap.getPane('labelPane').style.zIndex = '650';

  function tileLayer(url, attribution, options) {
    return L.tileLayer(url, Object.assign({ attribution, maxZoom: 18 }, options || {}));
  }

  function addPoint(map, latlng, color, radius) {
    return L.circleMarker(latlng, { radius: radius || 7, color: '#dff8ff', weight: 2, fillColor: color, fillOpacity: 1 }).addTo(map);
  }

  function addLabel(map, latlng, text, cls, anchor, labelColor, labelFontSize) {
    var styles = [];
    if (labelColor) styles.push(`color:${labelColor}`);
    if (labelFontSize) styles.push(`font-size:${labelFontSize}px`);
    var styleAttr = styles.length ? ` style="${styles.join(';')}"` : '';
    return L.marker(latlng, {
      pane: 'labelPane',
      icon: L.divIcon({
        className: 'map-label',
        html: `<div class="label-box ${cls}"${styleAttr}>${escapeHtml(text)}</div>`,
        iconAnchor: anchor || [0, 0]
      }),
      interactive: false,
      keyboard: false
    }).addTo(map);
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char];
    });
  }

  function pointLatLng(point) {
    if (typeof point.lat === 'number' && typeof point.lng === 'number') {
      return [point.lat, point.lng];
    }
    if (Array.isArray(point.latlng) && point.latlng.length === 2) {
      return point.latlng;
    }
    return null;
  }

  function getMap(key) {
    if (!maps[key]) {
      throw new Error(`Unknown map key: ${key}`);
    }
    return maps[key];
  }

  function getMapsForPoint(point) {
    if (!point.map) {
      return [oldMap, newMap];
    }
    if (!maps[point.map]) {
      console.warn(`Unknown map key in map-data.json: ${point.map}`);
      return [];
    }
    return [getMap(point.map)];
  }

  const layerDefinitions = LAYER_CATALOG.allLayers;
  const layerDefinitionByKey = layerDefinitions.reduce((acc, def) => {
    acc[def.key] = def;
    return acc;
  }, {});
  function getInitialLayerKey(mapKey) {
    const configuredKey = DEFAULT_LAYER_KEYS[mapKey];
    if (layerDefinitionByKey[configuredKey]) {
      return configuredKey;
    }

    const fallbackKey = FALLBACK_LAYER_KEYS[mapKey];
    if (layerDefinitionByKey[fallbackKey]) {
      return fallbackKey;
    }

    return layerDefinitions[0] ? layerDefinitions[0].key : null;
  }

  const activeLayerKeys = {
    old: getInitialLayerKey('old'),
    new: getInitialLayerKey('new')
  };

  function layerAttribution(def) {
    return def.attribution || `&copy; 国土地理院（${escapeHtml(def.title)}）`;
  }

  function createLayerMap() {
    return layerDefinitions.reduce((acc, def) => {
      acc[def.key] = tileLayer(def.url, layerAttribution(def), {
        minZoom: def.minZoom,
        maxZoom: def.maxZoom,
        maxNativeZoom: def.maxNativeZoom,
        opacity: 1
      });
      return acc;
    }, {});
  }

  function populateLayerSwitcher(switcherId, activeKey) {
    const el = document.getElementById(switcherId);
    if (!el) return;

    el.innerHTML = '';
    const baseGroup = document.createElement('optgroup');
    baseGroup.label = '地図';
    LAYER_CATALOG.baseLayers.forEach((def) => baseGroup.appendChild(createLayerOption(def, activeKey)));
    el.appendChild(baseGroup);

    LAYER_CATALOG.layerGroups.forEach((group) => {
      const optgroup = document.createElement('optgroup');
      optgroup.label = group.label;
      group.layers.forEach((def) => optgroup.appendChild(createLayerOption(def, activeKey)));
      el.appendChild(optgroup);
    });
  }

  function createLayerOption(def, activeKey) {
    const option = document.createElement('option');
    option.value = def.key;
    option.textContent = def.title;
    option.selected = def.key === activeKey;
    return option;
  }

  function clampZoomForLayer(map, layerKey, zoom) {
    const bounds = getLayerZoomBounds(layerKey);
    let nextZoom = zoom;
    nextZoom = Math.max(nextZoom, bounds.min);
    nextZoom = Math.min(nextZoom, bounds.max);
    return Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), nextZoom));
  }

  function getLayerZoomBounds(layerKey) {
    const def = layerDefinitionByKey[layerKey];
    return {
      min: def && typeof def.minZoom === 'number' ? def.minZoom : MAP_ZOOM_LIMITS.min,
      max: def && typeof def.maxZoom === 'number' ? def.maxZoom : MAP_ZOOM_LIMITS.max
    };
  }

  function applyLayerZoomBounds(map, layerKey, options) {
    const bounds = getLayerZoomBounds(layerKey);
    map.setMaxZoom(bounds.max);
    map.setMinZoom(bounds.min);

    const nextZoom = clampZoomForLayer(map, layerKey, map.getZoom());
    if (nextZoom !== map.getZoom()) {
      map.setZoom(nextZoom, options || {});
    }
  }

  function setMapLayer(map, layersMap, mapKey, nextLayerKey) {
    const currentLayerKey = activeLayerKeys[mapKey];
    if (nextLayerKey === currentLayerKey || !layersMap[nextLayerKey]) return;

    const currentLayer = layersMap[currentLayerKey];
    if (currentLayer) {
      map.removeLayer(currentLayer);
    }

    map.addLayer(layersMap[nextLayerKey]);
    activeLayerKeys[mapKey] = nextLayerKey;
    applyLayerZoomBounds(map, nextLayerKey);
  }

  const oldLayers = createLayerMap();
  const newLayers = createLayerMap();
  if (!activeLayerKeys.old || !activeLayerKeys.new) {
    setLayerSwitcherMessage('地図レイヤーが見つかりません');
    return;
  }

  oldLayers[activeLayerKeys.old].addTo(oldMap);
  newLayers[activeLayerKeys.new].addTo(newMap);
  applyLayerZoomBounds(oldMap, activeLayerKeys.old, { animate: false });
  applyLayerZoomBounds(newMap, activeLayerKeys.new, { animate: false });

  function setupCustomSwitcher(switcherId, map, layersMap, mapKey) {
    const el = document.getElementById(switcherId);
    if (!el) return;

    el.onchange = () => {
      setMapLayer(map, layersMap, mapKey, el.value);
    };
  }

  populateLayerSwitcher('switcher-old', activeLayerKeys.old);
  populateLayerSwitcher('switcher-new', activeLayerKeys.new);
  setupCustomSwitcher('switcher-old', oldMap, oldLayers, 'old');
  setupCustomSwitcher('switcher-new', newMap, newLayers, 'new');

  L.control.zoom({ position: 'bottomright' }).addTo(oldMap);
  L.control.zoom({ position: 'bottomright' }).addTo(newMap);

  const locationPins = [];

  function addCurrentLocationPin(latlng) {
    const point = { latlng: [latlng.lat, latlng.lng], label: '現在地', class: 'label-cool', anchor: [0, 16] };
    [oldMap, newMap].forEach((map) => {
      locationPins.push(addPoint(map, point.latlng, '#22c55e', 7));
      locationPins.push(addLabel(map, point.latlng, point.label, point.class, point.anchor));
    });
    oldMap.setView(latlng, Math.max(oldMap.getZoom(), 15), { animate: true });
    newMap.setView(latlng, Math.max(newMap.getZoom(), 15), { animate: true });
  }

  function clearLocationPins() {
    locationPins.forEach((layer) => layer.remove());
    locationPins.length = 0;
  }

  function clearCustomPoints() {
    while (customPoints.length > 0) {
      deleteCustomPoint(customPoints[0]);
    }
  }

  function resetLayerSwitchers() {
    const initialOld = getInitialLayerKey('old');
    const initialNew = getInitialLayerKey('new');
    setMapLayer(oldMap, oldLayers, 'old', initialOld);
    setMapLayer(newMap, newLayers, 'new', initialNew);
    const oldSel = document.getElementById('switcher-old');
    const newSel = document.getElementById('switcher-new');
    if (oldSel) oldSel.value = initialOld;
    if (newSel) newSel.value = initialNew;
  }

  function purgeAllPins() {
    clearFixedPoints();
    clearCustomPoints();
    clearLocationPins();
    updateKmlOutput();
    resetLayerSwitchers();
    setDefaultView();
  }

  // ── UI utilities: toast & confirm modal ──────────────────────────────
  function showToast(message, type) {
    const container = document.getElementById('toast-container');
    if (!container) { alert(message); return; }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'error');
    toast.innerHTML = `<span class="toast-message">${escapeHtml(message)}</span><button class="toast-close" aria-label="閉じる">✕</button>`;
    function dismiss() {
      toast.classList.add('toast-out');
      setTimeout(() => toast.remove(), 260);
    }
    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, 6000);
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-in'));
  }

  function showConfirmModal({ title, message, confirmLabel, onConfirm }) {
    const overlay   = document.getElementById('confirm-modal-overlay');
    const titleEl   = document.getElementById('confirm-modal-title');
    const descEl    = document.getElementById('confirm-modal-desc');
    const okBtn     = document.getElementById('confirm-modal-ok');
    const cancelBtn = document.getElementById('confirm-modal-cancel');
    if (!overlay) { if (window.confirm(message)) onConfirm(); return; }

    titleEl.textContent = title || '確認';
    descEl.textContent  = message || '';
    okBtn.textContent   = confirmLabel || 'OK';

    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.add('open');
    setTimeout(() => cancelBtn.focus(), 50);

    function close() {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('open');
      cleanup();
    }
    function handleOk()      { close(); onConfirm(); }
    function handleCancel()  { close(); }
    function handleKey(e)    { if (e.key === 'Escape') handleCancel(); }
    function handleBackdrop(e) { if (e.target === overlay) handleCancel(); }
    function cleanup() {
      okBtn.removeEventListener('click', handleOk);
      cancelBtn.removeEventListener('click', handleCancel);
      document.removeEventListener('keydown', handleKey);
      overlay.removeEventListener('click', handleBackdrop);
    }
    okBtn.addEventListener('click', handleOk);
    cancelBtn.addEventListener('click', handleCancel);
    document.addEventListener('keydown', handleKey);
    overlay.addEventListener('click', handleBackdrop);
  }
  // ────────────────────────────────────────────────────────────────────────────

  (function setupLocateButton() {
    const btn = document.getElementById('btn-locate');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!window.isSecureContext) {
        showToast('位置情報APIは HTTPS または localhost 環境でのみ利用できます。');
        return;
      }
      if (!navigator.geolocation) {
        showToast('このブラウザでは位置情報APIが利用できません。');
        return;
      }
      navigator.geolocation.getCurrentPosition(function (pos) {
        addCurrentLocationPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, function (err) {
        showToast('現在地を取得できませんでした。' + err.message);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  })();

  (function setupPurgeButton() {
    const btn = document.getElementById('btn-purge');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showConfirmModal({
        title: 'すべてクリア',
        message: 'ピン・現在地・レイヤー設定をすべてリセットします。この操作は元に戻せません。',
        confirmLabel: 'クリアする',
        onConfirm: purgeAllPins
      });
    });
  })();

  const fixedPoints = { old: [], new: [] };

  function fitMapsToBounds(boundsValue) {
    const bounds = L.latLngBounds(boundsValue);
    oldMap.fitBounds(bounds, { padding: [18, 18], maxZoom: 16 });
    newMap.fitBounds(bounds, { padding: [18, 18], maxZoom: 16 });
  }

  function setDefaultView() {
    oldMap.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom, { animate: false });
    newMap.setView(DEFAULT_VIEW.center, DEFAULT_VIEW.zoom, { animate: false });
  }

  setDefaultView();

  function drawFromData(data) {
    if (Array.isArray(data.bounds) && data.bounds.length === 2) {
      fitMapsToBounds(data.bounds);
    }

    if (Array.isArray(data.points)) {
      data.points.forEach((p) => {
        // Show on both maps by default (or on specified map)
        const mapsToUse = getMapsForPoint(p);
        
        mapsToUse.forEach((map) => {
          const latlng = pointLatLng(p);
          if (!latlng) return;

          const circleMarker = p.color && p.radius ? addPoint(map, latlng, p.color, p.radius) : null;
          const labelMarker = p.label ? addLabel(map, latlng, p.label, p.class, p.anchor) : null;
          
          // Store fixed points for toggle functionality
          const mapKey = map === oldMap ? 'old' : 'new';
          if (circleMarker || labelMarker) {
            fixedPoints[mapKey].push({
              circle: circleMarker,
              label: labelMarker
            });
          }
        });
      });
    }
  }

  // Clear all currently displayed fixed (preset) points from both maps
  function clearFixedPoints() {
    ['old', 'new'].forEach((key) => {
      fixedPoints[key].forEach((p) => {
        if (p.circle) p.circle.remove();
        if (p.label) p.label.remove();
      });
      fixedPoints[key] = [];
    });
  }

  let syncing = false;
  function sync(source, target) {
    source.on('move zoom', function () {
      if (syncing) return;
      syncing = true;
      const targetKey = target === oldMap ? 'old' : 'new';
      const nextZoom = clampZoomForLayer(target, activeLayerKeys[targetKey], source.getZoom());
      target.setView(source.getCenter(), nextZoom, { animate: false });
      syncing = false;
    });
  }
  sync(oldMap, newMap);
  sync(newMap, oldMap);

  function refreshMaps() { oldMap.invalidateSize(); newMap.invalidateSize(); }
  window.addEventListener('load', refreshMaps);
  window.addEventListener('resize', refreshMaps);
  setTimeout(refreshMaps, 120);

  // ── Preset Loader ──────────────────────────────────────────────────────────
  (function setupPresetLoader() {
    const selectEl = document.getElementById('preset-select');
    const loadBtn = document.getElementById('btn-load-preset');
    const statusEl = document.getElementById('preset-status');
    if (!selectEl || !loadBtn) return;

    function setStatus(message, isError) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'preset-status' + (isError ? ' preset-status-error' : ' preset-status-ok');
    }

    function clearStatus() {
      if (!statusEl) return;
      statusEl.textContent = '';
      statusEl.className = 'preset-status';
    }

    function fetchJson(url) {
      return fetch(url, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
        return r.json();
      });
    }

    function fetchKml(url) {
      return fetch(url, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} from ${url}`);
        return r.text();
      }).then((text) => parseKml(text));
    }

    // Load preset index from preset/index.json
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const indexUrl = `${basePath}preset/index.json`;

    fetchJson(indexUrl)
      .then((presets) => {
        selectEl.innerHTML = '';
        if (!Array.isArray(presets) || presets.length === 0) {
          const opt = document.createElement('option');
          opt.value = '';
          opt.textContent = 'プリセットがありません';
          selectEl.appendChild(opt);
          return;
        }

        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = 'プリセットを選択...';
        selectEl.appendChild(placeholder);

        presets.forEach((preset) => {
          const opt = document.createElement('option');
          opt.value = preset.file || '';
          opt.textContent = preset.title || preset.id || preset.file;
          selectEl.appendChild(opt);
        });

        loadBtn.disabled = false;
      })
      .catch((err) => {
        console.warn('preset/index.json の読み込みに失敗しました。', err);
        selectEl.innerHTML = '<option value="">プリセットを利用できません</option>';
        setStatus('プリセット一覧の読み込みに失敗しました（HTTPサーバー経由で起動してください）。', true);
      });

    selectEl.addEventListener('change', () => {
      clearStatus();
    });

    loadBtn.addEventListener('click', () => {
      const selectedFile = selectEl.value;
      if (!selectedFile) {
        setStatus('プリセットを選択してください。', true);
        return;
      }

      const originalBtnText = loadBtn.textContent;
      loadBtn.disabled = true;
      loadBtn.textContent = '読み込み中...';
      clearStatus();

      const presetUrl = `${basePath}${selectedFile}`;
      const isKml = selectedFile.toLowerCase().endsWith('.kml');
      const loader = isKml ? fetchKml(presetUrl) : fetchJson(presetUrl);

      loader
        .then((data) => {
          clearFixedPoints();
          drawFromData(data);
          const selectedOption = selectEl.options[selectEl.selectedIndex];
          setStatus(`「${selectedOption.textContent}」を読み込みました。`, false);
        })
        .catch((err) => {
          console.error('プリセットの読み込みに失敗しました。', err);
          setStatus('プリセットの読み込みに失敗しました。', true);
        })
        .finally(() => {
          loadBtn.disabled = false;
          loadBtn.textContent = originalBtnText;
        });
    });
  })();
  // ──────────────────────────────────────────────────────────────────────────

  // ── KML Parser & File Loader ──────────────────────────────────────────────
  function parseKml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('KMLのXMLパースに失敗しました: ' + parseError.textContent.slice(0, 120));
    }

    // boundsは後で計算
    const points = [];
    const defaultColors = ['#0ea5c6', '#f7b267', '#ff8f83', '#22c55e', '#a78bfa'];
    let colorIdx = 0;

    const placemarks = Array.from(doc.querySelectorAll('Placemark'));
    placemarks.forEach((pm) => {
      const coordsEl = pm.querySelector('Point > coordinates');
      if (!coordsEl) return;

      const raw = coordsEl.textContent.trim();
      const parts = raw.split(',');
      if (parts.length < 2) return;

      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (isNaN(lat) || isNaN(lng)) return;

      const nameEl = pm.querySelector('name');
      const label = nameEl ? nameEl.textContent.trim() : 'KML地点';

      // StyleのIconStyle colorからピン色を推測
      let color = defaultColors[colorIdx % defaultColors.length];
      const iconColorEl = pm.querySelector('Style > IconStyle > color') ||
                          pm.querySelector('IconStyle > color');
      if (iconColorEl) {
        const kmlColor = iconColorEl.textContent.trim();
        // KML color is aabbggrr
        if (/^[0-9a-fA-F]{8}$/.test(kmlColor)) {
          const rr = kmlColor.slice(6, 8);
          const gg = kmlColor.slice(4, 6);
          const bb = kmlColor.slice(2, 4);
          color = `#${rr}${gg}${bb}`;
        }
      }
      colorIdx++;

      points.push({
        lat,
        lng,
        label,
        color,
        radius: 6,
        class: 'label-slate',
        anchor: [0, 16]
      });
    });

    // KMLのDocument/Folder名をタイトルとして取得
    let bounds = null;
    if (points.length > 0) {
      const lats = points.map((p) => p.lat);
      const lngs = points.map((p) => p.lng);
      const padding = 0.005;
      bounds = [
        [Math.min(...lats) - padding, Math.min(...lngs) - padding],
        [Math.max(...lats) + padding, Math.max(...lngs) + padding]
      ];
    }

    return { points, bounds };
  }

  (function setupKmlFileLoader() {
    const fileInput = document.getElementById('kml-file-input');
    const fileNameLabel = document.getElementById('kml-file-name');
    const loadBtn = document.getElementById('btn-load-kml');
    const statusEl = document.getElementById('kml-upload-status');
    if (!fileInput || !loadBtn) return;

    function setStatus(message, isError) {
      if (!statusEl) return;
      statusEl.textContent = message;
      statusEl.className = 'preset-status' + (isError ? ' preset-status-error' : ' preset-status-ok');
    }

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        fileNameLabel.textContent = file.name;
        loadBtn.disabled = false;
        setStatus('', false);
      } else {
        fileNameLabel.textContent = 'ファイル未選択';
        loadBtn.disabled = true;
      }
    });

    loadBtn.addEventListener('click', () => {
      const file = fileInput.files[0];
      if (!file) {
        setStatus('KMLファイルを選択してください。', true);
        return;
      }

      loadBtn.disabled = true;
      loadBtn.textContent = '読み込み中...';

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = parseKml(e.target.result);
          if (data.points.length === 0) {
            setStatus('KMLにPoint地点が見つかりませんでした。Placemark > Point 要素を含むKMLファイルを選択してください。', true);
          } else {
            clearFixedPoints();
            drawFromData(data);
            setStatus(`「${file.name}」から ${data.points.length} 件の地点を読み込みました。`, false);
          }
        } catch (err) {
          console.error('KMLの読み込みに失敗しました。', err);
          setStatus('KMLの読み込みに失敗しました: ' + err.message, true);
        } finally {
          loadBtn.disabled = false;
          loadBtn.textContent = '読み込む';
        }
      };
      reader.onerror = () => {
        setStatus('ファイルの読み込みに失敗しました。', true);
        loadBtn.disabled = false;
        loadBtn.textContent = '読み込む';
      };
      reader.readAsText(file, 'UTF-8');
    });
  })();
  // ──────────────────────────────────────────────────────────────────────────

  // Coordinate Display Controls
  const CoordsControl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function () {
      const container = L.DomUtil.create('div', 'coords-display');
      container.innerHTML = 'Lat: -<br>Lng: -';
      return container;
    }
  });

  const oldCoords = new CoordsControl();
  oldCoords.addTo(oldMap);
  const newCoords = new CoordsControl();
  newCoords.addTo(newMap);
  const isMobilePointer = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  let preserveMobilePinCoords = false;

  function setCoordsDisplay(latlng) {
    const lat = latlng.lat.toFixed(6);
    const lng = latlng.lng.toFixed(6);
    const text = `Lat: ${lat}<br>Lng: ${lng}`;
    oldCoords.getContainer().innerHTML = text;
    newCoords.getContainer().innerHTML = text;
  }

  function updateCoordsFromPointer(e) {
    setCoordsDisplay(e.latlng);
  }

  function updateCoordsFromCenter(map) {
    if (preserveMobilePinCoords) return;
    if (!map._loaded) return;
    setCoordsDisplay(map.getCenter());
  }

  if (isMobilePointer) {
    const onMobileMoveStart = () => {
      preserveMobilePinCoords = false;
    };
    oldMap.on('dragstart zoomstart', onMobileMoveStart);
    newMap.on('dragstart zoomstart', onMobileMoveStart);
    oldMap.on('move zoom', () => updateCoordsFromCenter(oldMap));
    newMap.on('move zoom', () => updateCoordsFromCenter(newMap));
  } else {
    oldMap.on('mousemove', updateCoordsFromPointer);
    newMap.on('mousemove', updateCoordsFromPointer);
    oldMap.on('mouseout', () => updateCoordsFromCenter(oldMap));
    newMap.on('mouseout', () => updateCoordsFromCenter(newMap));
  }

  oldMap.on('moveend zoomend', () => updateCoordsFromCenter(oldMap));
  newMap.on('moveend zoomend', () => updateCoordsFromCenter(newMap));
  updateCoordsFromCenter(oldMap);

  // Click-to-Add Custom Point Creator
  const customPoints = [];


  function updateKmlOutput() {
    const el = document.getElementById('kml-output');
    if (!el) return;
    
    const kmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const kmlNs = '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2">';
    const docStart = '<Document>';
    const docEnd = '</Document>';
    const kmlEnd = '</kml>';
    
    const placemarks = customPoints.map(p => {
      const lat = p.lat;
      const lng = p.lng;
      const name = escapeHtml(p.label);
      const color = p.color || '#0ea5c6';
      const radius = p.radius || 6;
      
      return `  <Placemark>\n    <name>${name}</name>\n    <description>Color: ${escapeHtml(color)}, Radius: ${radius}px</description>\n    <Style>\n      <IconStyle>\n        <color>${hexToKmlColor(color)}</color>\n        <scale>${radius / 7}</scale>\n      </IconStyle>\n    </Style>\n    <Point>\n      <coordinates>${lng},${lat},0</coordinates>\n    </Point>\n  </Placemark>`;
    }).join('\n');
    
    const kmlContent = `${kmlHeader}\n${kmlNs}\n${docStart}\n${placemarks}\n${docEnd}\n${kmlEnd}`;
    el.value = kmlContent;
  }

  function normalizeHexColor(color) {
    const value = String(color || '').trim().replace(/^#/, '');
    if (/^[0-9A-Fa-f]{3}$/.test(value)) {
      return value.split('').map((char) => char + char).join('').toUpperCase();
    }
    if (/^[0-9A-Fa-f]{6}$/.test(value)) {
      return value.toUpperCase();
    }
    return '0EA5C6';
  }

  function hexToKmlColor(color) {
    const hex = normalizeHexColor(color);
    const rr = hex.slice(0, 2);
    const gg = hex.slice(2, 4);
    const bb = hex.slice(4, 6);
    return `ff${bb}${gg}${rr}`.toLowerCase();
  }

  function bindDeletePopup(pointObj) {
    pointObj.layers.oldCircle.bindPopup(() => createDeletePopupContent(pointObj));
    pointObj.layers.newCircle.bindPopup(() => createDeletePopupContent(pointObj));

    pointObj.layers.oldCircle.on('click', L.DomEvent.stopPropagation);
    pointObj.layers.newCircle.on('click', L.DomEvent.stopPropagation);
  }

  function createDeletePopupContent(pointObj) {
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-form';
    popupContent.innerHTML = `
      <strong style="color: #15323b; font-size: 13px; display: block; margin-bottom: 4px;">${escapeHtml(pointObj.label)}</strong>
      <div style="font-size: 10px; color: #5d7480; line-height: 1.4; margin-bottom: 10px;">
        <div><strong>Pos: </strong> ${pointObj.lat.toFixed(6)}, ${pointObj.lng.toFixed(6)}</div>
        <div><strong>Created: </strong> ${pointObj.createdAt}</div>
      </div>
      <button class="popup-btn danger" style="width: 100%;">削除する</button>
    `;

    popupContent.querySelector('button').onclick = () => deleteCustomPoint(pointObj);
    return popupContent;
  }

  function deleteCustomPoint(pointObj) {
    if (pointObj.layers) {
      Object.keys(pointObj.layers).forEach((key) => {
        if (pointObj.layers[key]) {
          pointObj.layers[key].remove();
        }
      });
    }

    const idx = customPoints.indexOf(pointObj);
    if (idx > -1) {
      customPoints.splice(idx, 1);
    }

    updateKmlOutput();
  }

  // ── Custom Pin Modal ────────────────────────────────────────────────────────
  let pendingPinLatLng = null;

  function showPinModal(latlng) {
    pendingPinLatLng = latlng;
    const overlay = document.getElementById('pin-modal-overlay');
    const latlngInput = document.getElementById('modal-pin-latlng');
    const labelInput = document.getElementById('modal-pin-label');
    if (latlngInput) {
      latlngInput.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    }
    if (labelInput) {
      labelInput.value = '';
    }
    if (overlay) {
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('open');
      setTimeout(() => labelInput && labelInput.focus(), 50);
    }
  }

  function hidePinModal() {
    const overlay = document.getElementById('pin-modal-overlay');
    if (overlay) {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('open');
    }
    pendingPinLatLng = null;
  }

  function setupPinModal() {
    const overlay     = document.getElementById('pin-modal-overlay');
    const cancelBtn   = document.getElementById('modal-pin-cancel');
    const confirmBtn  = document.getElementById('modal-pin-confirm');
    const colorPicker      = document.getElementById('modal-pin-color');
    const colorText        = document.getElementById('modal-pin-color-text');
    const labelColorPicker  = document.getElementById('modal-label-color');
    const labelColorText    = document.getElementById('modal-label-color-text');
    const labelInput        = document.getElementById('modal-pin-label');
    const radiusInput       = document.getElementById('modal-pin-radius');
    const labelFontSizeInput = document.getElementById('modal-label-font-size');
    if (!overlay) return;

    // Close on backdrop click or Escape key
    overlay.addEventListener('click', (e) => { if (e.target === overlay) hidePinModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) hidePinModal(); });
    if (cancelBtn) cancelBtn.addEventListener('click', hidePinModal);

    // Sync color pickers ↔ text inputs
    if (colorPicker && colorText) {
      colorPicker.oninput = () => { colorText.value = colorPicker.value.toUpperCase(); };
      colorText.oninput = () => {
        let val = colorText.value.trim();
        if (val && !val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) colorPicker.value = val;
      };
    }
    if (labelColorPicker && labelColorText) {
      labelColorPicker.oninput = () => { labelColorText.value = labelColorPicker.value.toUpperCase(); };
      labelColorText.oninput = () => {
        let val = labelColorText.value.trim();
        if (val && !val.startsWith('#')) val = '#' + val;
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) labelColorPicker.value = val;
      };
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        if (!pendingPinLatLng) return;
        const latlng = pendingPinLatLng;
        const latFixed = latlng.lat.toFixed(6);
        const lngFixed = latlng.lng.toFixed(6);

        const label = (labelInput && labelInput.value.trim()) || 'カスタム地点';

        let color = colorText ? colorText.value.trim().toUpperCase() : '#0EA5C6';
        if (color && !color.startsWith('#')) color = '#' + color;
        if (!/^#[0-9A-Fa-f]{6}$/.test(color) && !/^#[0-9A-Fa-f]{3}$/.test(color)) {
          color = (colorPicker && colorPicker.value) || '#0EA5C6';
        }

        let labelColor = labelColorText ? labelColorText.value.trim().toUpperCase() : '#12313B';
        if (labelColor && !labelColor.startsWith('#')) labelColor = '#' + labelColor;
        if (!/^#[0-9A-Fa-f]{6}$/.test(labelColor) && !/^#[0-9A-Fa-f]{3}$/.test(labelColor)) {
          labelColor = (labelColorPicker && labelColorPicker.value) || '#12313B';
        }

        const radius = (radiusInput && parseInt(radiusInput.value, 10)) || 6;
        const labelFontSize = (labelFontSizeInput && parseInt(labelFontSizeInput.value, 10)) || 14;
        const cls = 'label-box';
        const anchor = [0, 16];

        const now = new Date();
        const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const newPointLatLng = [parseFloat(latFixed), parseFloat(lngFixed)];
        const newPoint = {
          lat: parseFloat(latFixed),
          lng: parseFloat(lngFixed),
          label,
          color,
          labelColor,
          radius,
          labelFontSize,
          class: cls,
          anchor,
          createdAt: dateStr
        };

        newPoint.layers = {
          oldCircle: addPoint(oldMap, newPointLatLng, color, radius),
          oldLabel:  addLabel(oldMap, newPointLatLng, label, cls, anchor, labelColor, labelFontSize),
          newCircle: addPoint(newMap, newPointLatLng, color, radius),
          newLabel:  addLabel(newMap, newPointLatLng, label, cls, anchor, labelColor, labelFontSize)
        };

        bindDeletePopup(newPoint);
        customPoints.push(newPoint);
        updateKmlOutput();
        hidePinModal();
      });
    }
  }
  // ────────────────────────────────────────────────────────────────────────────

  function onMapClick(e) {
    preserveMobilePinCoords = isMobilePointer;
    setCoordsDisplay(e.latlng);
    showPinModal(e.latlng);
  }

  oldMap.on('click', onMapClick);
  newMap.on('click', onMapClick);
  setupPinModal();

  // Toggle fixed points visibility - per map
  function setupPointToggle(toggleId, mapKey, map) {
    const toggleElement = document.getElementById(toggleId);
    if (!toggleElement) return;
    
    toggleElement.onchange = () => {
      const isVisible = toggleElement.checked;
      fixedPoints[mapKey].forEach((p) => {
        if (p.circle) {
          if (isVisible) {
            map.addLayer(p.circle);
          } else {
            map.removeLayer(p.circle);
          }
        }
        if (p.label) {
          if (isVisible) {
            map.addLayer(p.label);
          } else {
            map.removeLayer(p.label);
          }
        }
      });
    };
  }
  
  setupPointToggle('toggle-fixed-points-old', 'old', oldMap);
  setupPointToggle('toggle-fixed-points-new', 'new', newMap);

  EXPORT_TOOLS.setupDownloadButton('btn-download-kml', 'kml-output', 'custom-points.kml', 'application/vnd.google-earth.kml+xml;charset=utf-8');
})();
