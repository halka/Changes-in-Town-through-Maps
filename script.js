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
  const DEFAULT_BOUNDS = [
    [35.668, 139.740],
    [35.702, 139.768]
  ];
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

  function addLabel(map, latlng, text, cls, anchor) {
    return L.marker(latlng, {
      pane: 'labelPane',
      icon: L.divIcon({
        className: 'map-label',
        html: `<div class="label-box ${cls}">${escapeHtml(text)}</div>`,
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

  function escapeXml(value) {
    return escapeHtml(value);
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
    map.setMinZoom(MAP_ZOOM_LIMITS.min);
    map.setMaxZoom(MAP_ZOOM_LIMITS.max);
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
    var initialOld = getInitialLayerKey('old');
    var initialNew = getInitialLayerKey('new');
    setMapLayer(oldMap, oldLayers, 'old', initialOld);
    setMapLayer(newMap, newLayers, 'new', initialNew);
    var oldSel = document.getElementById('switcher-old');
    var newSel = document.getElementById('switcher-new');
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

  (function setupLocateButton() {
    const btn = document.getElementById('btn-locate');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!window.isSecureContext) {
        alert('位置情報APIは、HTTPSまたはlocalhostなどのセキュアな接続環境でのみ利用可能です。現在の接続環境（file:// など）では制限されています。');
        return;
      }
      if (!navigator.geolocation) {
        alert('このブラウザでは位置情報APIが利用できません。');
        return;
      }
      navigator.geolocation.getCurrentPosition(function (pos) {
        addCurrentLocationPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, function (err) {
        alert('現在地を取得できませんでした: ' + err.message);
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  })();

  (function setupPurgeButton() {
    const btn = document.getElementById('btn-purge');
    if (!btn) return;
    btn.addEventListener('click', purgeAllPins);
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

  const DEFAULT_MAP_DATA_FALLBACK = {
    bounds: [
      [35.2748, 139.6238],
      [35.3238, 139.6754]
    ],
    points: [
      {
        lat: 35.2846,
        lng: 139.6538,
        label: "JR横須賀駅",
        color: "#f7b267",
        radius: 6,
        class: "label-slate",
        anchor: [0, 16]
      },
      {
        lat: 35.283136,
        lng: 139.657118,
        label: "トンネルを抜けて海が見える",
        color: "#f7b267",
        radius: 6,
        class: "label-slate",
        anchor: [0, 16]
      },
      {
        lat: 35.27588,
        lng: 139.6374,
        label: "横須賀IC（新ルート起点）",
        color: "#0ea5c6",
        radius: 7,
        class: "label-slate",
        anchor: [0, 16]
      },
      {
        lat: 35.282902,
        lng: 139.668631,
        label: "三笠公園入口 左折",
        color: "#0ea5c6",
        radius: 6,
        class: "label-slate",
        anchor: [0, 16]
      },
      {
        lat: 35.283484,
        lng: 139.668610,
        label: "直進しないで右に道なりに",
        color: "#0ea5c6",
        radius: 6,
        class: "label-slate",
        anchor: [0, 16]
      },
      {
        lat: 35.285330,
        lng: 139.674050,
        label: "三笠公園",
        color: "#ff8f83",
        radius: 8,
        class: "label-red",
        anchor: [0, 16]
      }
    ]
  };

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

  // ── KML Parser ────────────────────────────────────────────────────────────
  function parseKml(xmlText) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'application/xml');
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('KMLのXMLパースに失敗しました: ' + parseError.textContent.slice(0, 120));
    }

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

      // StyleのIconStyle colorからピン色を推測 (KML color: aabbggrr)
      let color = defaultColors[colorIdx % defaultColors.length];
      const iconColorEl = pm.querySelector('Style > IconStyle > color') ||
                          pm.querySelector('IconStyle > color');
      if (iconColorEl) {
        const kmlColor = iconColorEl.textContent.trim();
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
  // ──────────────────────────────────────────────────────────────────────────

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
          loadBtn.textContent = '読み込む';
        });
    });
  })();
  // ──────────────────────────────────────────────────────────────────────────


  // ── KML Parser & Local File Loader ────────────────────────────────────────
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
      const name = escapeXml(p.label);
      const color = p.color || '#0ea5c6';
      const radius = p.radius || 6;
      
      return `  <Placemark>\n    <name>${name}</name>\n    <description>Color: ${escapeXml(color)}, Radius: ${radius}px</description>\n    <Style>\n      <IconStyle>\n        <color>${hexToKmlColor(color)}</color>\n        <scale>${radius / 7}</scale>\n      </IconStyle>\n    </Style>\n    <Point>\n      <coordinates>${lng},${lat},0</coordinates>\n    </Point>\n  </Placemark>`;
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

  function onMapClick(e) {
    preserveMobilePinCoords = isMobilePointer;
    setCoordsDisplay(e.latlng);

    const latFixed = e.latlng.lat.toFixed(6);
    const lngFixed = e.latlng.lng.toFixed(6);

    const popupContent = `
      <div class="popup-form">
        <h4>地点追加</h4>
        <div class="popup-row">
          <label>緯度経度</label>
          <input type="text" value="${latFixed}, ${lngFixed}" readonly class="popup-input readonly">
        </div>
        <div class="popup-row">
          <label>ラベル名</label>
          <input type="text" id="pin-label" placeholder="例: 横須賀市役所" class="popup-input">
        </div>
        <div class="popup-row">
          <label>ピンの色</label>
          <div class="color-picker-group">
            <input type="color" id="pin-color" value="#0ea5c6" class="popup-color-input">
            <input type="text" id="pin-color-text" value="#0ea5c6" placeholder="#0ea5c6" class="popup-input" style="font-family: monospace; text-transform: uppercase;">
          </div>
        </div>
        <div class="popup-row">
          <label>文字の色</label>
          <select id="pin-class" class="popup-select">
            <option value="label-slate" selected>ブルー (Slate)</option>
            <option value="label-warm">オレンジ (Warm)</option>
            <option value="label-red">レッド (Red)</option>
            <option value="label-cool">グリーン (Cool)</option>
          </select>
        </div>
        <div class="popup-row">
          <label>半径 (px)</label>
          <input type="number" id="pin-radius" value="6" min="3" class="popup-input">
        </div>
        <div class="popup-actions">
          <button id="add-pin-confirm" class="popup-btn primary">追加</button>
        </div>
      </div>
    `;

    L.popup()
      .setLatLng(e.latlng)
      .setContent(popupContent)
      .openOn(e.target);
    setTimeout(() => setCoordsDisplay(e.latlng), 0);
  }

  // Bind popup events on maps to configure the custom point creation interface dynamically when a popup opens
  function setupPopupListeners(map) {
    map.on('popupopen', (e) => {
      const container = e.popup.getElement();
      if (!container) return;

      const btn = container.querySelector('#add-pin-confirm');
      if (!btn) return;

      const colorPicker = container.querySelector('#pin-color');
      const colorText = container.querySelector('#pin-color-text');
      const classSelect = container.querySelector('#pin-class');
      const labelInput = container.querySelector('#pin-label');
      const radiusInput = container.querySelector('#pin-radius');

      if (colorPicker && colorText) {
        colorPicker.oninput = () => {
          colorText.value = colorPicker.value.toUpperCase();
        };

        colorText.oninput = () => {
          let val = colorText.value.trim();
          if (val && !val.startsWith('#')) {
            val = '#' + val;
          }
          if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
            colorPicker.value = val;
          }
        };
      }

      btn.onclick = () => {
        const latlng = e.popup.getLatLng();
        const latFixed = latlng.lat.toFixed(6);
        const lngFixed = latlng.lng.toFixed(6);

        const label = (labelInput && labelInput.value.trim()) || 'カスタム地点';
        let color = colorText ? colorText.value.trim().toUpperCase() : '#0EA5C6';
        if (color && !color.startsWith('#')) {
          color = '#' + color;
        }
        if (!/^#[0-9A-Fa-f]{6}$/.test(color) && !/^#[0-9A-Fa-f]{3}$/.test(color)) {
          color = (colorPicker && colorPicker.value) || '#0EA5C6';
        }

        const radius = (radiusInput && parseInt(radiusInput.value, 10)) || 6;
        const cls = (classSelect && classSelect.value) || 'label-slate';
        const anchor = [0, 16];

        const now = new Date();
        const dateStr = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

        const newPoint = {
          lat: parseFloat(latFixed),
          lng: parseFloat(lngFixed),
          label: label,
          color: color,
          radius: radius,
          class: cls,
          anchor: anchor,
          createdAt: dateStr
        };
        const newPointLatLng = [newPoint.lat, newPoint.lng];

        newPoint.layers = {
          oldCircle: addPoint(oldMap, newPointLatLng, color, radius),
          oldLabel: addLabel(oldMap, newPointLatLng, label, cls, anchor),
          newCircle: addPoint(newMap, newPointLatLng, color, radius),
          newLabel: addLabel(newMap, newPointLatLng, label, cls, anchor)
        };

        bindDeletePopup(newPoint);

        customPoints.push(newPoint);
        updateKmlOutput();

        map.closePopup();
      };
    });
  }

  oldMap.on('click', onMapClick);
  newMap.on('click', onMapClick);
  setupPopupListeners(oldMap);
  setupPopupListeners(newMap);

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
