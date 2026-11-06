import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api/client.js';
import { useToast } from '../components/Toast.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  Layers,
  Search,
  Save,
  Compass,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Briefcase,
  Users,
  Shield,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  Minimize2,
  Crosshair,
  Map as MapIcon,
  ChevronRight,
  Info,
  Building2,
  Download,
  Filter,
  CheckCheck,
  AlertTriangle,
  TrendingUp,
  Percent,
  Sparkles,
  Navigation,
} from 'lucide-react';

const TILE_PROVIDERS = {
  positron: {
    name: 'Yorug‘',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  dark: {
    name: 'Qorong‘i',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 19,
  },
  osm: {
    name: 'Standart',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
  },
  satellite: {
    name: 'Yo‘ldosh',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
    maxZoom: 18,
  },
};

const RADIUS_PRESETS = [
  { label: '15 km (Shahar)', value: 15 },
  { label: '30 km (Katta shahar)', value: 30 },
  { label: '50 km (Markaz + tumanlar)', value: 50 },
  { label: '80 km (Viloyat)', value: 80 },
  { label: '120 km (Keng hudud)', value: 120 },
  { label: '180 km (Maksimal)', value: 180 },
];

const OPERATION_MODES = [
  {
    id: 'FULL_ACCESS',
    name: 'To‘liq ochiq',
    color: 'emerald',
    desc: 'Barcha xizmatlar, yangi e‘lonlar va ishchilar erkin ishlaydi',
  },
  {
    id: 'READ_ONLY',
    name: 'Faqat ko‘rish',
    color: 'amber',
    desc: 'Mavjud e‘lonlar ko‘rinadi, yangi e‘lon berish vaqtinchalik yopiq',
  },
  {
    id: 'BETA_TEST',
    name: 'Sinov rejimi (Beta)',
    color: 'indigo',
    desc: 'Cheklangan tartibda sinovdan o‘tkazilayotgan hudud',
  },
  {
    id: 'RESTRICTED',
    name: 'Vaqtincha cheklangan',
    color: 'red',
    desc: 'Hududda xizmat ko‘rsatish vaqtincha to‘xtatilgan',
  },
];

function normalizeName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/['`‘ʼʻ]/g, '')
    .replace(/respublikasi/g, '')
    .replace(/viloyati/g, '')
    .replace(/shahri/g, '')
    .replace(/region/g, '')
    .replace(/province/g, '')
    .replace(/city/g, '')
    .trim();
}

export default function MapManagementPage() {
  const { showToast } = useToast();

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const circleLayerRef = useRef(null);
  const centerMarkerRef = useRef(null);
  const jobMarkersGroupRef = useRef(null);
  const searchMarkerRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [regions, setRegions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [professions, setProfessions] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);

  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [activeTab, setActiveTab] = useState('bounds'); // 'bounds' | 'districts' | 'analytics'
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Form states for selected region
  const [formActive, setFormActive] = useState(true);
  const [formAllowJobs, setFormAllowJobs] = useState(true);
  const [formAllowWorkers, setFormAllowWorkers] = useState(true);
  const [formCenterLat, setFormCenterLat] = useState(41.281);
  const [formCenterLng, setFormCenterLng] = useState(69.2647);
  const [formRadiusKm, setFormRadiusKm] = useState(45);
  const [formMinSalaryRate, setFormMinSalaryRate] = useState('');
  const [formMaxSalaryRate, setFormMaxSalaryRate] = useState('');
  const [formOperationMode, setFormOperationMode] = useState('FULL_ACCESS');
  const [formNotes, setFormNotes] = useState('');

  // Map view & display settings
  const [tileType, setTileType] = useState('positron');
  const [layers, setLayers] = useState({
    boundaries: true,
    radius: true,
    jobs: true,
  });
  const [isPickingCenter, setIsPickingCenter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfessionId, setSelectedProfessionId] = useState('ALL');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

  // Geocoding live search
  const [geoSearchQuery, setGeoSearchQuery] = useState('');
  const [geoSearching, setGeoSearching] = useState(false);

  // District management inside selected region
  const [districtFilter, setDistrictFilter] = useState('');
  const [newDistrictName, setNewDistrictName] = useState('');
  const [editingDistrictId, setEditingDistrictId] = useState(null);
  const [editingDistrictName, setEditingDistrictName] = useState('');
  const [districtActionLoading, setDistrictActionLoading] = useState(false);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, regionsData, jobsData, profsData] = await Promise.all([
        api.get('/api/admin/map/stats'),
        api.get('/api/admin/map/regions'),
        api.get('/api/admin/map/jobs'),
        api.get('/api/professions').catch(() => []),
      ]);

      setStats(statsData);
      setRegions(regionsData || []);
      setJobs(jobsData || []);
      setProfessions(profsData || []);

      if (!selectedRegionId && regionsData?.length > 0) {
        const defaultRegion =
          regionsData.find((r) => r.name.toLowerCase().includes('toshkent shahri')) ||
          regionsData[0];
        setSelectedRegionId(defaultRegion.id);
      }
    } catch (err) {
      showToast(err.message || 'Xaritadagi ma‘lumotlarni yuklab bo‘lmadi', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Fetch GeoJSON boundaries
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}uzbekistan_regions.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON file not found');
        return res.json();
      })
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.warn('Could not load uzbekistan_regions.geojson:', err));
  }, []);

  // Sync form values when selected region changes
  useEffect(() => {
    if (!selectedRegionId || regions.length === 0) return;
    const r = regions.find((item) => item.id === selectedRegionId);
    if (r) {
      setSelectedRegion(r);
      setFormActive(r.active);
      setFormAllowJobs(r.allowJobs);
      setFormAllowWorkers(r.allowWorkers);
      setFormCenterLat(r.centerLat != null ? r.centerLat : 41.281);
      setFormCenterLng(r.centerLng != null ? r.centerLng : 69.2647);
      setFormRadiusKm(r.radiusKm != null ? r.radiusKm : 45);
      setFormMinSalaryRate(r.minSalaryRate != null ? String(r.minSalaryRate) : '');
      setFormMaxSalaryRate(r.maxSalaryRate != null ? String(r.maxSalaryRate) : '');
      setFormOperationMode(r.operationMode || 'FULL_ACCESS');
      setFormNotes(r.notes || '');
    }
  }, [selectedRegionId, regions]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const uzCenter = [41.3775, 64.5853];
    const map = L.map(mapContainerRef.current, {
      center: uzCenter,
      zoom: 6,
      minZoom: 5,
      maxZoom: 18,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topleft' }).addTo(map);

    const initialProvider = TILE_PROVIDERS[tileType] || TILE_PROVIDERS.positron;
    const tileLayer = L.tileLayer(initialProvider.url, {
      attribution: initialProvider.attribution,
      subdomains: initialProvider.subdomains || 'abc',
      maxZoom: initialProvider.maxZoom,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    jobMarkersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size on layout / fullscreen change
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen, activeTab]);

  // Update tile layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const provider = TILE_PROVIDERS[tileType] || TILE_PROVIDERS.positron;
    const newLayer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      subdomains: provider.subdomains || 'abc',
      maxZoom: provider.maxZoom,
    }).addTo(map);
    tileLayerRef.current = newLayer;
  }, [tileType]);

  // Map Click for Picking Center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    function handleMapClick(e) {
      if (!isPickingCenter) return;
      const { lat, lng } = e.latlng;
      setFormCenterLat(Number(lat.toFixed(5)));
      setFormCenterLng(Number(lng.toFixed(5)));
      setIsPickingCenter(false);
      showToast(
        `Yangi markaz belgilandi: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        'success'
      );
    }

    if (isPickingCenter) {
      map.getContainer().style.cursor = 'crosshair';
      map.on('click', handleMapClick);
    } else {
      map.getContainer().style.cursor = '';
      map.off('click', handleMapClick);
    }

    return () => {
      map.off('click', handleMapClick);
    };
  }, [isPickingCenter]);

  // Render GeoJSON Region Polygons
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonData) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (!layers.boundaries) return;

    const layer = L.geoJSON(geoJsonData, {
      style: (feature) => {
        const fName =
          feature.properties?.ADM1_UZ ||
          feature.properties?.ADM1_EN ||
          feature.properties?.name ||
          '';
        const norm = normalizeName(fName);
        const match = regions.find((r) => normalizeName(r.name) === norm);

        const isSelected = match && match.id === selectedRegionId;
        const isActive = match ? match.active : true;
        const mode = match ? match.operationMode : 'FULL_ACCESS';

        if (isSelected) {
          return {
            color: '#2563eb',
            weight: 3.5,
            opacity: 1,
            fillColor: isActive ? '#3b82f6' : '#ef4444',
            fillOpacity: 0.32,
          };
        }

        if (!isActive || mode === 'RESTRICTED') {
          return {
            color: '#ef4444',
            weight: 2,
            opacity: 0.9,
            dashArray: '6, 6',
            fillColor: '#f87171',
            fillOpacity: 0.22,
          };
        }

        if (mode === 'READ_ONLY' || mode === 'BETA_TEST') {
          return {
            color: '#f59e0b',
            weight: 2,
            opacity: 0.85,
            fillColor: '#fbbf24',
            fillOpacity: 0.18,
          };
        }

        return {
          color: '#0284c7',
          weight: 1.8,
          opacity: 0.75,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
        };
      },
      onEachFeature: (feature, featureLayer) => {
        const fName =
          feature.properties?.ADM1_UZ ||
          feature.properties?.ADM1_EN ||
          feature.properties?.name ||
          '';
        const norm = normalizeName(fName);
        const match = regions.find((r) => normalizeName(r.name) === norm);

        const regionName = match ? match.name : fName;
        const jobsCount = match ? match.jobsCount : 0;
        const workersCount = match ? match.workersCount : 0;
        const isActive = match ? match.active : true;
        const modeDesc =
          OPERATION_MODES.find((m) => m.id === match?.operationMode)?.name || 'Faol';

        featureLayer.bindTooltip(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
            <div style="font-weight: 800; font-size: 14px; color: #0f172a; margin-bottom: 2px;">${regionName}</div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 11.5px; margin-bottom: 3px;">
              <span style="color: ${isActive ? '#16a34a' : '#dc2626'}; font-weight: 700;">
                ● ${isActive ? modeDesc : 'Nofaol'}
              </span>
              <span style="color: #64748b;">${match?.districtCount || 0} ta tuman</span>
            </div>
            <div style="display: flex; gap: 10px; font-size: 11.5px; color: #334155; font-weight: 600;">
              <span>💼 ${jobsCount} ta ish</span>
              <span>👷 ${workersCount} ta ishchi</span>
            </div>
          </div>`,
          { sticky: true, className: 'map-region-tooltip' }
        );

        featureLayer.on({
          mouseover: (e) => {
            const l = e.target;
            l.setStyle({
              weight: 3.2,
              opacity: 1,
              fillOpacity: 0.38,
            });
            l.bringToFront();
          },
          mouseout: (e) => {
            layer.resetStyle(e.target);
          },
          click: (e) => {
            if (match) {
              setSelectedRegionId(match.id);
              map.fitBounds(e.target.getBounds(), { padding: [50, 50], maxZoom: 10 });
            }
          },
        });
      },
    }).addTo(map);

    geoJsonLayerRef.current = layer;
  }, [geoJsonData, regions, selectedRegionId, layers.boundaries]);

  // Render Radius Bounding Circle & Center Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (circleLayerRef.current) {
      map.removeLayer(circleLayerRef.current);
      circleLayerRef.current = null;
    }
    if (centerMarkerRef.current) {
      map.removeLayer(centerMarkerRef.current);
      centerMarkerRef.current = null;
    }

    if (!selectedRegion || !layers.radius) return;

    const lat = Number(formCenterLat);
    const lng = Number(formCenterLng);
    const radiusMeters = (Number(formRadiusKm) || 45) * 1000;

    if (isNaN(lat) || isNaN(lng)) return;

    const circleColor =
      formOperationMode === 'RESTRICTED' || !formActive
        ? '#dc2626'
        : formOperationMode === 'READ_ONLY' || formOperationMode === 'BETA_TEST'
        ? '#d97706'
        : '#2563eb';

    const circle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: circleColor,
      weight: 2,
      dashArray: '6, 6',
      fillColor: circleColor,
      fillOpacity: 0.12,
    }).addTo(map);

    circleLayerRef.current = circle;

    // Draggable center pin icon with pulse
    const centerIcon = L.divIcon({
      className: 'custom-center-pin',
      html: `<div style="
        width: 34px;
        height: 34px;
        background: ${circleColor};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.38);
        cursor: grab;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17],
    });

    const marker = L.marker([lat, lng], {
      icon: centerIcon,
      draggable: true,
      title: `${selectedRegion.name} markazi (surishingiz mumkin)`,
    }).addTo(map);

    marker.bindTooltip(
      `<b>${selectedRegion.name}</b><br/>Radiusi: ${formRadiusKm} km (surib markazni o‘zgartiring)`,
      { direction: 'top', offset: [0, -18] }
    );

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const nLat = Number(pos.lat.toFixed(5));
      const nLng = Number(pos.lng.toFixed(5));
      setFormCenterLat(nLat);
      setFormCenterLng(nLng);
      showToast(`Markaziy koordinata surildi: ${nLat}, ${nLng}`, 'info');
    });

    centerMarkerRef.current = marker;
  }, [
    selectedRegion,
    formCenterLat,
    formCenterLng,
    formRadiusKm,
    formActive,
    formOperationMode,
    layers.radius,
  ]);

  // Filtered Jobs on Map
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (!job.latitude || !job.longitude) return false;
      if (filterUrgentOnly && !job.urgent) return false;
      if (selectedProfessionId !== 'ALL') {
        const profName = professions.find(
          (p) => String(p.id) === String(selectedProfessionId)
        )?.name;
        if (profName && job.professionName !== profName) return false;
      }
      return true;
    });
  }, [jobs, filterUrgentOnly, selectedProfessionId, professions]);

  // Render Job Markers
  useEffect(() => {
    const group = jobMarkersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.jobs || filteredJobs.length === 0) return;

    filteredJobs.forEach((job) => {
      const isUrgent = job.urgent;
      const jobIcon = L.divIcon({
        className: 'custom-job-pin',
        html: `<div style="
          width: 30px;
          height: 30px;
          background: ${isUrgent ? '#ef4444' : '#059669'};
          border: 2.5px solid white;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          cursor: pointer;
          ${isUrgent ? 'animation: pulse 1.5s infinite;' : ''}
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      const paymentFormatted =
        job.payment != null
          ? Number(job.payment).toLocaleString('uz-UZ') + ' so‘m'
          : "Kelishuv bo'yicha";

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; min-width: 210px; padding: 4px;">
          ${
            isUrgent
              ? '<span style="background: #fee2e2; color: #b91c1c; font-size: 10.5px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">⚡ SHOSHILINCH</span>'
              : ''
          }
          <div style="font-weight: 800; font-size: 14.5px; margin-bottom: 4px; color: #0f172a;">
            ${job.title || "Buyurtma"}
          </div>
          <div style="color: #059669; font-weight: 800; font-size: 13.5px; margin-bottom: 6px;">
            💰 ${paymentFormatted}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 3px;">
            📍 ${job.regionName || ''}${job.districtName ? ', ' + job.districtName : ''}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            👤 ${job.employerName || 'Ish beruvchi'} ${job.employerPhone ? '• ' + job.employerPhone : ''}
          </div>
          <a href="#/jobs?search=${encodeURIComponent(job.title || '')}" style="
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 5px 12px;
            border-radius: 7px;
            font-size: 12px;
            font-weight: 700;
          ">E‘lonni ko‘rish &rarr;</a>
        </div>
      `;

      const marker = L.marker([job.latitude, job.longitude], { icon: jobIcon });
      marker.bindPopup(popupHtml);
      group.addLayer(marker);
    });
  }, [filteredJobs, layers.jobs]);

  // Center to whole Uzbekistan
  const resetToUzbekistan = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([41.3775, 64.5853], 6, { duration: 1.2 });
  };

  // Zoom to a specific region
  const zoomToRegion = (region) => {
    setSelectedRegionId(region.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (region.centerLat && region.centerLng) {
      map.flyTo([region.centerLat, region.centerLng], 9, { duration: 1 });
    }
  };

  // Live Geocoding Search
  const handleGeoSearch = async (e) => {
    e.preventDefault();
    if (!geoSearchQuery.trim()) return;

    try {
      setGeoSearching(true);
      const results = await api.get('/api/geo/search', {
        q: geoSearchQuery.trim(),
      });

      if (!results || results.length === 0) {
        showToast('Hech qanday manzil topilmadi', 'error');
        return;
      }

      const top = results[0];
      const map = mapInstanceRef.current;
      if (!map) return;

      if (searchMarkerRef.current) {
        map.removeLayer(searchMarkerRef.current);
      }

      const searchIcon = L.divIcon({
        className: 'search-result-pin',
        html: `<div style="
          width: 36px;
          height: 36px;
          background: #7c3aed;
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 14px rgba(124, 58, 237, 0.45);
        ">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([top.lat, top.lon], { icon: searchIcon }).addTo(
        map
      );
      marker
        .bindPopup(
          `<div style="font-size: 13px; font-weight: 700; color: #1e1b4b;">${top.displayName}</div>`
        )
        .openPopup();
      searchMarkerRef.current = marker;

      map.flyTo([top.lat, top.lon], 13, { duration: 1.2 });
      showToast(`Manzil topildi: ${top.name || geoSearchQuery}`, 'success');
    } catch (err) {
      showToast('Qidiruvda xatolik yuz berdi', 'error');
    } finally {
      setGeoSearching(false);
    }
  };

  // Save Region Settings
  const handleSaveRegion = async () => {
    if (!selectedRegionId) return;

    try {
      setSaving(true);
      const payload = {
        name: selectedRegion.name,
        centerLat: Number(formCenterLat),
        centerLng: Number(formCenterLng),
        radiusKm: Number(formRadiusKm),
        active: formActive,
        allowJobs: formAllowJobs,
        allowWorkers: formAllowWorkers,
        operationMode: formOperationMode,
        minSalaryRate: formMinSalaryRate ? Number(formMinSalaryRate) : null,
        maxSalaryRate: formMaxSalaryRate ? Number(formMaxSalaryRate) : null,
        notes: formNotes,
      };

      const updated = await api.put(
        `/api/admin/map/regions/${selectedRegionId}`,
        payload
      );

      setRegions((prev) =>
        prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      );
      setSelectedRegion((prev) => ({ ...prev, ...updated }));

      const newStats = await api.get('/api/admin/map/stats');
      setStats(newStats);

      showToast(
        `"${updated.name}" chegaralari va sozlamalari muvaffaqiyatli saqlandi!`,
        'success'
      );
    } catch (err) {
      showToast(err.message || 'Saqlashda xatolik yuz berdi', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Batch activate all regions
  const handleActivateAll = async () => {
    if (
      !window.confirm(
        'Barcha 14 ta hududni bir zumda faollashtirishni tasdiqlaysizmi?'
      )
    )
      return;

    try {
      setSaving(true);
      for (const r of regions) {
        if (!r.active) {
          await api.put(`/api/admin/map/regions/${r.id}`, {
            name: r.name,
            centerLat: r.centerLat,
            centerLng: r.centerLng,
            radiusKm: r.radiusKm,
            active: true,
            allowJobs: true,
            allowWorkers: true,
            operationMode: 'FULL_ACCESS',
          });
        }
      }
      showToast('Barcha hududlar muvaffaqiyatli faollashtirildi!', 'success');
      fetchData();
    } catch (err) {
      showToast(err.message || 'Xatolik', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Export Regions & Districts JSON
  const handleExportData = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(regions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ishchi-regions-map-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Xarita ma‘lumotlari eksport qilindi', 'success');
  };

  // Add District
  const handleAddDistrict = async (e) => {
    e.preventDefault();
    if (!newDistrictName.trim() || !selectedRegionId) return;

    try {
      setDistrictActionLoading(true);
      const created = await api.post(
        `/api/admin/map/regions/${selectedRegionId}/districts`,
        { name: newDistrictName.trim() }
      );

      const updatedDistricts = [
        ...(selectedRegion.districts || []),
        { id: created.id, name: created.name, jobsCount: 0, workersCount: 0 },
      ].sort((a, b) => a.name.localeCompare(b.name));

      setSelectedRegion((prev) => ({
        ...prev,
        districts: updatedDistricts,
        districtCount: updatedDistricts.length,
      }));

      setRegions((prev) =>
        prev.map((r) =>
          r.id === selectedRegionId
            ? {
                ...r,
                districts: updatedDistricts,
                districtCount: updatedDistricts.length,
              }
            : r
        )
      );

      setNewDistrictName('');
      showToast(`"${created.name}" tumani qo‘shildi`, 'success');
    } catch (err) {
      showToast(err.message || 'Tuman qo‘shishda xatolik', 'error');
    } finally {
      setDistrictActionLoading(false);
    }
  };

  // Save District Edit
  const handleSaveDistrictEdit = async (districtId) => {
    if (!editingDistrictName.trim()) return;

    try {
      setDistrictActionLoading(true);
      const updated = await api.put(`/api/admin/map/districts/${districtId}`, {
        name: editingDistrictName.trim(),
      });

      const updatedDistricts = selectedRegion.districts.map((d) =>
        d.id === districtId ? { ...d, name: updated.name } : d
      );

      setSelectedRegion((prev) => ({ ...prev, districts: updatedDistricts }));
      setRegions((prev) =>
        prev.map((r) =>
          r.id === selectedRegionId ? { ...r, districts: updatedDistricts } : r
        )
      );

      setEditingDistrictId(null);
      setEditingDistrictName('');
      showToast(`Tuman nomi yangilandi`, 'success');
    } catch (err) {
      showToast(err.message || 'Tahrirlashda xatolik', 'error');
    } finally {
      setDistrictActionLoading(false);
    }
  };

  // Delete District
  const handleDeleteDistrict = async (districtId, districtName) => {
    if (
      !window.confirm(
        `"${districtName}" tumanini o‘chirishni tasdiqlaysizmi?`
      )
    ) {
      return;
    }

    try {
      setDistrictActionLoading(true);
      await api.del(`/api/admin/map/districts/${districtId}`);

      const updatedDistricts = selectedRegion.districts.filter(
        (d) => d.id !== districtId
      );

      setSelectedRegion((prev) => ({
        ...prev,
        districts: updatedDistricts,
        districtCount: updatedDistricts.length,
      }));

      setRegions((prev) =>
        prev.map((r) =>
          r.id === selectedRegionId
            ? {
                ...r,
                districts: updatedDistricts,
                districtCount: updatedDistricts.length,
              }
            : r
        )
      );

      showToast(`"${districtName}" tumani o‘chirildi`, 'success');
    } catch (err) {
      showToast(err.message || 'O‘chirishda xatolik yuz berdi', 'error');
    } finally {
      setDistrictActionLoading(false);
    }
  };

  // Filtered districts inside selected region
  const filteredDistricts = useMemo(() => {
    if (!selectedRegion?.districts) return [];
    if (!districtFilter.trim()) return selectedRegion.districts;
    return selectedRegion.districts.filter((d) =>
      d.name.toLowerCase().includes(districtFilter.toLowerCase().trim())
    );
  }, [selectedRegion, districtFilter]);

  // Filtered regions for quick search
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regions;
    const q = searchQuery.toLowerCase();
    return regions.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.districts?.some((d) => d.name.toLowerCase().includes(q))
    );
  }, [regions, searchQuery]);

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-bg p-4 overflow-y-auto' : ''}`}>
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MapIcon size={20} strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-[20px] font-extrabold m-0 flex items-center gap-2">
                Xarita & Hududlar boshqaruvi
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                  GEO HUB
                </span>
              </h1>
              <p className="text-[12.5px] text-text-secondary mt-0.5 mb-0">
                Viloyatlarni chegaralash, operatsion rejimlar, geografik radius va tumanlar nazorati
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportData}
            className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[12.5px]"
            title="Ma‘lumotlarni JSON eksport qilish"
          >
            <Download size={14} />
            Eksport
          </button>
          <button
            onClick={handleActivateAll}
            disabled={saving}
            className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[12.5px] text-emerald-600 hover:text-emerald-700"
            title="Barcha hududlarni bir zumda faollashtirish"
          >
            <CheckCheck size={14} />
            Barchasini faollashtirish
          </button>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[12.5px]"
            title="Yangilash"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Yangilash
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="btn btn-secondary flex items-center gap-1.5 py-1.5 px-3 text-[12.5px]"
            title={isFullscreen ? 'Kichraytirish' : 'To‘liq ekranga ochish'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Kichraytirish' : 'To‘liq ekran'}
          </button>
        </div>
      </div>

      {/* Overview Analytics Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
            <Compass size={20} />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-text leading-none">
              {stats?.totalRegions || 14}
            </div>
            <div className="text-[12px] text-text-secondary mt-1">Jami hududlar</div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle size={20} />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-emerald-600 leading-none">
              {stats?.activeRegions ?? 14}
            </div>
            <div className="text-[12px] text-text-secondary mt-1">
              Faol hududlar ({stats?.restrictedRegions ? `${stats.restrictedRegions} ta cheklangan` : '100% ochiq'})
            </div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <Briefcase size={20} />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-indigo-600 leading-none">
              {filteredJobs.length}
            </div>
            <div className="text-[12px] text-text-secondary mt-1">
              Xaritadagi faol e‘lonlar
            </div>
          </div>
        </div>

        <div className="card p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-[20px] font-extrabold text-purple-600 leading-none">
              {stats?.totalDistricts || 199}
            </div>
            <div className="text-[12px] text-text-secondary mt-1">
              Tuman va shaharlar
            </div>
          </div>
        </div>
      </div>

      {/* Horizontal Region Quick Selector Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[12px] scrollbar-thin">
        {regions.map((r) => {
          const isSel = r.id === selectedRegionId;
          const isActive = r.active;
          return (
            <button
              key={r.id}
              onClick={() => zoomToRegion(r)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap font-medium transition-all shrink-0 ${
                isSel
                  ? 'bg-primary text-white border-primary shadow-sm scale-102'
                  : 'bg-surface hover:bg-bg border-line text-text-secondary hover:text-text'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isActive ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
              <span>{r.name}</span>
              {r.jobsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSel ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {r.jobsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Region Search + Live Geocoding Search */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Geocoding address search */}
          <form
            onSubmit={handleGeoSearch}
            className="relative flex items-center max-w-[260px] flex-1"
          >
            <Navigation
              size={14}
              className="absolute left-3 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Manzil qidirish (ko‘cha, bino)..."
              value={geoSearchQuery}
              onChange={(e) => setGeoSearchQuery(e.target.value)}
              className="input pl-8.5 py-1.5 text-[12.5px] w-full"
            />
            {geoSearching && (
              <RefreshCw
                size={13}
                className="absolute right-2.5 animate-spin text-primary"
              />
            )}
          </form>

          {/* Region dropdown */}
          <select
            value={selectedRegionId || ''}
            onChange={(e) => {
              const r = regions.find((x) => x.id === Number(e.target.value));
              if (r) zoomToRegion(r);
            }}
            className="select py-1.5 text-[12.5px] max-w-[200px]"
          >
            {filteredRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {!r.active ? '(Nofaol)' : ''} ({r.jobsCount} ta ish)
              </option>
            ))}
          </select>

          {/* Profession Filter */}
          <select
            value={selectedProfessionId}
            onChange={(e) => setSelectedProfessionId(e.target.value)}
            className="select py-1.5 text-[12.5px] max-w-[190px]"
          >
            <option value="ALL">Barcha kasblar</option>
            {professions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Urgent only toggle */}
          <button
            onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
            className={`px-2.5 py-1.5 rounded-[8px] border text-[12px] font-semibold flex items-center gap-1 transition-all ${
              filterUrgentOnly
                ? 'bg-red-500/15 border-red-500 text-red-700'
                : 'border-line text-text-secondary hover:text-text'
            }`}
          >
            ⚡ Shoshilinch
          </button>
        </div>

        {/* Right: Tile selector & Layer toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tiles */}
          <div className="flex items-center bg-bg rounded-[9px] p-0.5 border border-line text-[11.5px]">
            {Object.entries(TILE_PROVIDERS).map(([key, prov]) => (
              <button
                key={key}
                onClick={() => setTileType(key)}
                className={`px-2 py-1 rounded-[7px] font-medium transition-all ${
                  tileType === key
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {prov.name}
              </button>
            ))}
          </div>

          {/* Layers */}
          <div className="flex items-center gap-1 text-[11.5px]">
            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, boundaries: !prev.boundaries }))
              }
              className={`px-2 py-1 rounded-[7px] border font-medium flex items-center gap-1 ${
                layers.boundaries
                  ? 'border-primary/50 bg-primary/10 text-primary-text'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Layers size={12} /> Chegaralar
            </button>

            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, radius: !prev.radius }))
              }
              className={`px-2 py-1 rounded-[7px] border font-medium flex items-center gap-1 ${
                layers.radius
                  ? 'border-primary/50 bg-primary/10 text-primary-text'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Sliders size={12} /> Doira
            </button>

            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, jobs: !prev.jobs }))
              }
              className={`px-2 py-1 rounded-[7px] border font-medium flex items-center gap-1 ${
                layers.jobs
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Briefcase size={12} /> E‘lonlar ({filteredJobs.length})
            </button>
          </div>

          <button
            onClick={resetToUzbekistan}
            className="btn btn-secondary p-1.5 rounded-[8px]"
            title="O‘zbekiston markaziga qaytish"
          >
            <Compass size={16} />
          </button>
        </div>
      </div>

      {/* Main 2-Column Section: Map + Extended Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Map View (7 cols) */}
        <div className="lg:col-span-7 card p-0 overflow-hidden relative shadow-sm border border-line">
          <div
            ref={mapContainerRef}
            className={`w-full bg-slate-100 relative z-0 transition-all ${
              isFullscreen ? 'h-[750px]' : 'h-[620px]'
            }`}
          />

          {/* Floating Glass Indicators */}
          <div className="absolute top-3 right-3 z-[400] bg-surface/90 backdrop-blur-md border border-line rounded-xl px-3 py-1.5 text-[11px] shadow-sm flex items-center gap-3">
            <span className="flex items-center gap-1 text-primary font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              Faol hudud
            </span>
            <span className="flex items-center gap-1 text-danger font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block"></span>
              Cheklangan
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              E‘lonlar ({filteredJobs.length})
            </span>
          </div>

          {/* Crosshair mode prompt */}
          {isPickingCenter && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-primary text-white text-[13px] font-semibold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
              <Crosshair size={16} />
              Xarita ustiga bosing — yangi markaziy koordinata belgilanadi
              <button
                onClick={() => setIsPickingCenter(false)}
                className="ml-2 bg-white/20 hover:bg-white/30 rounded-full px-2.5 py-0.5 text-[11px]"
              >
                Bekor
              </button>
            </div>
          )}
        </div>

        {/* Extended Region Management Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {selectedRegion ? (
            <div className="card p-4 space-y-4 shadow-sm border border-line">
              {/* Region Header & Save Action */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-extrabold m-0 text-text">
                      {selectedRegion.name}
                    </h2>
                    <span
                      className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                        formActive
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-red-500/15 text-red-700'
                      }`}
                    >
                      {formActive ? 'FAOL' : 'NOFAOL'}
                    </span>
                  </div>
                  <div className="text-[12px] text-text-secondary mt-1 flex items-center gap-3">
                    <span>🏢 {selectedRegion.districtCount || 0} ta tuman</span>
                    <span>💼 {selectedRegion.jobsCount || 0} ta ish</span>
                    <span>👷 {selectedRegion.workersCount || 0} ta ishchi</span>
                  </div>
                </div>

                <button
                  onClick={handleSaveRegion}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-1.5 py-2 px-3.5 text-[12.5px] font-extrabold shrink-0 shadow-xs"
                >
                  <Save size={15} />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-line gap-2 text-[13px] font-semibold">
                <button
                  onClick={() => setActiveTab('bounds')}
                  className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'bounds'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text'
                  }`}
                >
                  <Sliders size={14} /> Chegaralar & Rejim
                </button>
                <button
                  onClick={() => setActiveTab('districts')}
                  className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'districts'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text'
                  }`}
                >
                  <Building2 size={14} /> Tumanlar ({selectedRegion.districts?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`pb-2 px-1 border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'analytics'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-text-secondary hover:text-text'
                  }`}
                >
                  <TrendingUp size={14} /> Tahlil & Stavka
                </button>
              </div>

              {/* TAB 1: BOUNDS & OPERATION MODES */}
              {activeTab === 'bounds' && (
                <div className="space-y-4">
                  {/* Operation Mode Selector */}
                  <div>
                    <label className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px] block mb-2">
                      Operatsion chegara rejimi
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {OPERATION_MODES.map((mode) => {
                        const isSel = formOperationMode === mode.id;
                        return (
                          <div
                            key={mode.id}
                            onClick={() => {
                              setFormOperationMode(mode.id);
                              if (mode.id === 'RESTRICTED') {
                                setFormActive(false);
                              } else {
                                setFormActive(true);
                              }
                            }}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                              isSel
                                ? 'border-primary bg-primary/10 shadow-xs'
                                : 'border-line bg-surface hover:bg-bg'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2.5 h-2.5 rounded-full ${
                                  mode.id === 'FULL_ACCESS'
                                    ? 'bg-emerald-500'
                                    : mode.id === 'RESTRICTED'
                                    ? 'bg-red-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              <span className="text-[12.5px] font-bold text-text">
                                {mode.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-text-secondary mt-1 leading-tight line-clamp-2">
                              {mode.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Switch Controls */}
                  <div className="bg-bg/60 rounded-xl p-3 border border-line space-y-2.5 text-[13px]">
                    <label className="flex items-center justify-between cursor-pointer select-none">
                      <div>
                        <div className="font-semibold text-text">Viloyatda faollik holati</div>
                        <div className="text-[11px] text-text-secondary">
                          Platforma xizmatlari ochiq / cheklangan
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formActive}
                        onChange={(e) => setFormActive(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
                      <div>
                        <div className="font-semibold text-text">Yangi e‘lon berishga ruxsat</div>
                        <div className="text-[11px] text-text-secondary">
                          Ish beruvchilar yangi ish joylay oladi
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formAllowJobs}
                        onChange={(e) => setFormAllowJobs(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>

                    <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
                      <div>
                        <div className="font-semibold text-text">Ishchilar ro‘yxatdan o‘tishi</div>
                        <div className="text-[11px] text-text-secondary">
                          Yangi ishchilar profil ochishi mumkin
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formAllowWorkers}
                        onChange={(e) => setFormAllowWorkers(e.target.checked)}
                        className="w-4 h-4 accent-primary cursor-pointer"
                      />
                    </label>
                  </div>

                  {/* Center Coordinates & Bounding Radius */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                        Markaziy koordinatalar
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsPickingCenter(!isPickingCenter)}
                        className={`text-[11.5px] font-semibold px-2 py-1 rounded-[7px] border flex items-center gap-1 transition-all ${
                          isPickingCenter
                            ? 'bg-primary text-white border-primary shadow-xs'
                            : 'border-line text-primary hover:bg-primary/10'
                        }`}
                      >
                        <Crosshair size={13} />
                        {isPickingCenter ? 'Xarita tanlanmoqda...' : 'Xaritadan tanlash'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] text-text-secondary block mb-1">
                          Kenglik (Lat)
                        </span>
                        <input
                          type="number"
                          step="0.0001"
                          value={formCenterLat}
                          onChange={(e) => setFormCenterLat(e.target.value)}
                          className="input py-1.5 text-[12.5px] w-full"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-text-secondary block mb-1">
                          Uzunlik (Lng)
                        </span>
                        <input
                          type="number"
                          step="0.0001"
                          value={formCenterLng}
                          onChange={(e) => setFormCenterLng(e.target.value)}
                          className="input py-1.5 text-[12.5px] w-full"
                        />
                      </div>
                    </div>

                    {/* Radius Slider with Presets */}
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[12px] font-semibold text-text">
                          Qamrov va chegaralash radiusi:
                        </span>
                        <span className="text-[13px] font-extrabold text-primary">
                          {formRadiusKm} km ({Math.round(formRadiusKm * 1000).toLocaleString('uz-UZ')} metr)
                        </span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="220"
                        step="5"
                        value={formRadiusKm}
                        onChange={(e) => setFormRadiusKm(Number(e.target.value))}
                        className="w-full accent-primary cursor-pointer"
                      />

                      {/* Presets buttons */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {RADIUS_PRESETS.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onClick={() => setFormRadiusKm(p.value)}
                            className={`px-2 py-0.5 rounded-[6px] border text-[11px] font-medium transition-all ${
                              formRadiusKm === p.value
                                ? 'bg-primary text-white border-primary'
                                : 'border-line bg-surface hover:bg-bg text-text-secondary'
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes / Reason */}
                    <div>
                      <label className="text-[11.5px] text-text-secondary block mb-1">
                        Admin eslatmasi / Cheklov sababi:
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Masalan: Markaziy zona, alohida qoidalar o‘rnatilgan..."
                        value={formNotes}
                        onChange={(e) => setFormNotes(e.target.value)}
                        className="input py-1.5 text-[12.5px] w-full resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: DISTRICTS MANAGEMENT */}
              {activeTab === 'districts' && (
                <div className="space-y-3">
                  {/* Search and Add District */}
                  <div className="space-y-2">
                    <div className="relative">
                      <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
                      />
                      <input
                        type="text"
                        placeholder="Tumanni qidirish..."
                        value={districtFilter}
                        onChange={(e) => setDistrictFilter(e.target.value)}
                        className="input pl-8.5 py-1.5 text-[12.5px] w-full"
                      />
                    </div>

                    <form onSubmit={handleAddDistrict} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Yangi tuman / shahar nomi..."
                        value={newDistrictName}
                        onChange={(e) => setNewDistrictName(e.target.value)}
                        className="input py-1.5 text-[12.5px] flex-1"
                      />
                      <button
                        type="submit"
                        disabled={districtActionLoading || !newDistrictName.trim()}
                        className="btn btn-primary flex items-center gap-1 py-1.5 px-3 text-[12px] font-bold"
                      >
                        <Plus size={14} /> Qo‘shish
                      </button>
                    </form>
                  </div>

                  {/* District Items */}
                  <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1 border border-line rounded-xl p-2 bg-bg/40">
                    {filteredDistricts.length > 0 ? (
                      filteredDistricts.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-surface border border-transparent hover:border-line text-[12.5px] transition-all"
                        >
                          {editingDistrictId === d.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingDistrictName}
                                onChange={(e) => setEditingDistrictName(e.target.value)}
                                className="input py-1 text-[12px] flex-1"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveDistrictEdit(d.id)}
                                disabled={districtActionLoading}
                                className="text-emerald-600 font-bold text-[12px] px-2 py-0.5 rounded hover:bg-emerald-50"
                              >
                                Saqlash
                              </button>
                              <button
                                onClick={() => setEditingDistrictId(null)}
                                className="text-text-secondary text-[12px] px-1.5 py-0.5"
                              >
                                Bekor
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                <Building2 size={14} className="text-text-secondary shrink-0" />
                                <span className="font-semibold text-text truncate">
                                  {d.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {d.jobsCount > 0 && (
                                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                                    {d.jobsCount} ish
                                  </span>
                                )}
                                <button
                                  onClick={() => {
                                    setEditingDistrictId(d.id);
                                    setEditingDistrictName(d.name);
                                  }}
                                  className="text-text-secondary hover:text-primary p-1 rounded"
                                  title="Tahrirlash"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteDistrict(d.id, d.name)}
                                  className="text-text-secondary hover:text-danger p-1 rounded"
                                  title="O‘chirish"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-[12px] text-text-secondary text-center py-6">
                        Tumanlar topilmadi
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SALARY LIMITS & REGIONAL ANALYTICS */}
              {activeTab === 'analytics' && (
                <div className="space-y-4">
                  {/* Salary Limit Configuration */}
                  <div className="bg-bg/60 p-3 rounded-xl border border-line space-y-3">
                    <div className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                      Hududiy stavka chegaralari
                    </div>

                    <div>
                      <label className="text-[11.5px] text-text-secondary block mb-1">
                        Minimal tavsiya stavkasi (so‘m/kun):
                      </label>
                      <input
                        type="number"
                        placeholder="Masalan: 80 000"
                        value={formMinSalaryRate}
                        onChange={(e) => setFormMinSalaryRate(e.target.value)}
                        className="input py-1.5 text-[12.5px] w-full"
                      />
                    </div>

                    <div>
                      <label className="text-[11.5px] text-text-secondary block mb-1">
                        Maksimal stavka chegarasi (so‘m/kun, firibgarlikdan himoya):
                      </label>
                      <input
                        type="number"
                        placeholder="Masalan: 5 000 000"
                        value={formMaxSalaryRate}
                        onChange={(e) => setFormMaxSalaryRate(e.target.value)}
                        className="input py-1.5 text-[12.5px] w-full"
                      />
                    </div>
                  </div>

                  {/* Regional Share & Activity Stats */}
                  <div className="space-y-2.5">
                    <div className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                      Respublika bo‘yicha ulushi
                    </div>

                    <div className="card p-3 space-y-3">
                      <div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-text-secondary">E‘lonlar ulushi:</span>
                          <span className="font-bold text-text">
                            {stats?.totalJobs
                              ? ((selectedRegion.jobsCount / stats.totalJobs) * 100).toFixed(1)
                              : 0}
                            % ({selectedRegion.jobsCount} ta)
                          </span>
                        </div>
                        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                stats?.totalJobs
                                  ? (selectedRegion.jobsCount / stats.totalJobs) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[12px] mb-1">
                          <span className="text-text-secondary">Ishchilar ulushi:</span>
                          <span className="font-bold text-text">
                            {stats?.totalWorkers
                              ? ((selectedRegion.workersCount / stats.totalWorkers) * 100).toFixed(1)
                              : 0}
                            % ({selectedRegion.workersCount} ta)
                          </span>
                        </div>
                        <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                stats?.totalWorkers
                                  ? (selectedRegion.workersCount / stats.totalWorkers) * 100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="card text-center py-16 text-text-secondary space-y-3">
              <MapPin size={40} className="mx-auto text-primary opacity-60" />
              <div className="font-bold text-text">Viloyat tanlanmagan</div>
              <div className="text-[12.5px] max-w-[280px] mx-auto">
                Xaritadagi viloyat poligoniga bosing yoki yuqoridagi ro‘yxatdan tanlang.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
