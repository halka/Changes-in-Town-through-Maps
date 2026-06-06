(function () {
  const DEFAULT_LAYER_KEYS = {
    old: 'photo1974',
    new: 'osm'
  };

  const BASE_LAYERS = [
    { key: 'standard', title: '標準地図（国土地理院）', url: 'https://maps.gsi.go.jp/xyz/std/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://maps.gsi.go.jp/" target="_blank">国土地理院</a>', minZoom: 2, maxZoom: 18 },
    { key: 'pale', title: '淡色地図（国土地理院）', url: 'https://maps.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://maps.gsi.go.jp/" target="_blank">国土地理院</a>', minZoom: 2, maxZoom: 18 },
    { key: 'osm', title: 'OpenStreetMap', url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors', minZoom: 2, maxZoom: 19, maxNativeZoom: 19 },
    { key: 'cartoLight', title: 'CARTO Positron', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', attribution: '&copy; OpenStreetMap contributors &copy; CARTO', minZoom: 2, maxZoom: 20, maxNativeZoom: 20 },
    { key: 'topo', title: 'OpenTopoMap', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attribution: '&copy; OpenStreetMap contributors, SRTM | OpenTopoMap (CC-BY-SA)', minZoom: 2, maxZoom: 17, maxNativeZoom: 17 }
  ];

  const LAYER_GROUPS = [
    {
      label: '年代別の写真',
      layers: [
        { key: 'photo1928', title: '1928年頃', url: 'https://maps.gsi.go.jp/xyz/ort_1928/{z}/{x}/{y}.png', minZoom: 2, maxZoom: 18, maxNativeZoom: 18 },
        { key: 'photo1936', title: '1936年-1942年頃', url: 'https://maps.gsi.go.jp/xyz/ort_riku10/{z}/{x}/{y}.png', minZoom: 2, maxZoom: 18, maxNativeZoom: 18 },
        { key: 'photo1945', title: '1945年-1950年', url: 'https://maps.gsi.go.jp/xyz/ort_USA10/{z}/{x}/{y}.png', minZoom: 2, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1961', title: '1961年-1969年', url: 'https://maps.gsi.go.jp/xyz/ort_old10/{z}/{x}/{y}.png', minZoom: 2, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1974', title: '1974年-1978年', url: 'https://maps.gsi.go.jp/xyz/gazo1/{z}/{x}/{y}.jpg', minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1979', title: '1979年-1983年', url: 'https://maps.gsi.go.jp/xyz/gazo2/{z}/{x}/{y}.jpg', minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1984', title: '1984年-1986年', url: 'https://maps.gsi.go.jp/xyz/gazo3/{z}/{x}/{y}.jpg', minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo1987', title: '1987年-1990年', url: 'https://maps.gsi.go.jp/xyz/gazo4/{z}/{x}/{y}.jpg', minZoom: 10, maxZoom: 18, maxNativeZoom: 17 },
        { key: 'photo2007', title: '2007年', url: 'https://maps.gsi.go.jp/xyz/nendophoto2007/{z}/{x}/{y}.png', minZoom: 14, maxZoom: 18 },
        { key: 'seamlessTimeline', title: '時系列表示（ZL14以上）', url: 'https://maps.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', minZoom: 14, maxZoom: 18 },
        { key: 'seamless', title: '全国最新写真（シームレス）', url: 'https://maps.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg', minZoom: 2, maxZoom: 18 }
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
