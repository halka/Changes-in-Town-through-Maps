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
    [35.2748, 139.6238],
    [35.3238, 139.6754]
  ];
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

  function addCurrentLocationPin(latlng) {
    const point = { latlng: [latlng.lat, latlng.lng], label: '現在地', class: 'label-cool', anchor: [0, 16] };
    [oldMap, newMap].forEach((map) => {
      addPoint(map, point.latlng, '#22c55e', 7);
      addLabel(map, point.latlng, point.label, point.class, point.anchor);
    });
    oldMap.setView(latlng, Math.max(oldMap.getZoom(), 15), { animate: true });
    newMap.setView(latlng, Math.max(newMap.getZoom(), 15), { animate: true });
  }

  function addCurrentLocationControl(map) {
    const Control = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function () {
        const btn = L.DomUtil.create('button', 'locate-btn');
        btn.type = 'button';
        btn.textContent = '現在地にピン';
        L.DomEvent.disableClickPropagation(btn);
        btn.addEventListener('click', function () {
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
        return btn;
      }
    });
    map.addControl(new Control());
  }

  addCurrentLocationControl(oldMap);

  const fixedPoints = { old: [], new: [] };

  function fitMapsToBounds(boundsValue) {
    const bounds = L.latLngBounds(boundsValue);
    oldMap.fitBounds(bounds, { padding: [18, 18], maxZoom: 16 });
    newMap.fitBounds(bounds, { padding: [18, 18], maxZoom: 16 });
  }

  fitMapsToBounds(DEFAULT_BOUNDS);

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

  function fetchMapData() {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
    const candidates = [
      `${basePath}map-data.json`,
      './map-data.json',
      'map-data.json'
    ];

    return candidates.reduce((promise, url) => promise.catch(() => {
      return fetch(url, { cache: 'no-cache' }).then((r) => {
        if (!r.ok) {
          throw new Error(`map-data.json returned ${r.status} from ${url}`);
        }
        return r.json();
      });
    }), Promise.reject(new Error('map-data.json not loaded')));
  }

  fetchMapData()
    .then(drawFromData)
    .catch((err) => {
      console.error('map-data.json の読み込みに失敗しました。', err);
    });

  let syncing = false;
  function sync(source, target) {
    source.on('moveend zoomend', function () {
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

  function updateJsonOutput() {
    const el = document.getElementById('json-output');
    if (!el) return;
    const cleanList = customPoints.map(p => ({
      lat: p.lat,
      lng: p.lng,
      label: p.label,
      color: p.color,
      radius: p.radius,
      class: p.class,
      anchor: p.anchor
    }));
    el.value = JSON.stringify(cleanList, null, 2);
  }

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

    updateJsonOutput();
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

    // Bind confirm click after popup renders in DOM
    setTimeout(() => {
      const btn = document.getElementById('add-pin-confirm');
      const colorPicker = document.getElementById('pin-color');
      const colorText = document.getElementById('pin-color-text');
      const classSelect = document.getElementById('pin-class');

      if (!btn || !colorPicker || !colorText || !classSelect) return;

      // Sync text input when color picker swatch changes
      colorPicker.oninput = () => {
        colorText.value = colorPicker.value.toUpperCase();
      };

      // Sync color picker swatch when text input changes
      colorText.oninput = () => {
        let val = colorText.value.trim();
        if (val && !val.startsWith('#')) {
          val = '#' + val;
        }
        if (/^#[0-9A-Fa-f]{6}$/.test(val) || /^#[0-9A-Fa-f]{3}$/.test(val)) {
          colorPicker.value = val;
        }
      };

      btn.onclick = () => {
        const labelInput = document.getElementById('pin-label');
        const radiusInput = document.getElementById('pin-radius');
        if (!labelInput || !radiusInput) return;

        const label = labelInput.value.trim() || 'カスタム地点';
        let color = colorText.value.trim().toUpperCase();
        if (color && !color.startsWith('#')) {
          color = '#' + color;
        }
        // Fallback to picker value if input is invalid hex format
        if (!/^#[0-9A-Fa-f]{6}$/.test(color) && !/^#[0-9A-Fa-f]{3}$/.test(color)) {
          color = colorPicker.value;
        }

        const radius = parseInt(radiusInput.value, 10) || 6;
        const cls = classSelect.value;
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
        updateJsonOutput();
        updateKmlOutput();

        e.target.closePopup();
      };
    }, 50);
  }

  oldMap.on('click', onMapClick);
  newMap.on('click', onMapClick);

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

  EXPORT_TOOLS.setupExportTabs();
  EXPORT_TOOLS.setupDownloadButton('btn-download-json', 'json-output', 'custom-points.json', 'application/json;charset=utf-8');
  EXPORT_TOOLS.setupDownloadButton('btn-download-kml', 'kml-output', 'custom-points.kml', 'application/vnd.google-earth.kml+xml;charset=utf-8');
})();
