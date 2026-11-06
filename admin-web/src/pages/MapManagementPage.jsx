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
  Crosshair,
  Map as MapIcon,
  ChevronRight,
  Info,
  Building2,
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

// Region name normalizer for mapping GeoJSON features to DB entities
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

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState(null);
  const [regions, setRegions] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [geoJsonData, setGeoJsonData] = useState(null);

  const [selectedRegionId, setSelectedRegionId] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Form states for selected region
  const [formActive, setFormActive] = useState(true);
  const [formAllowJobs, setFormAllowJobs] = useState(true);
  const [formAllowWorkers, setFormAllowWorkers] = useState(true);
  const [formCenterLat, setFormCenterLat] = useState(41.281);
  const [formCenterLng, setFormCenterLng] = useState(69.2647);
  const [formRadiusKm, setFormRadiusKm] = useState(45);
  const [formMinSalaryRate, setFormMinSalaryRate] = useState('');
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

  // District management
  const [newDistrictName, setNewDistrictName] = useState('');
  const [editingDistrictId, setEditingDistrictId] = useState(null);
  const [editingDistrictName, setEditingDistrictName] = useState('');
  const [districtActionLoading, setDistrictActionLoading] = useState(false);

  // Load initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, regionsData, jobsData] = await Promise.all([
        api.get('/api/admin/map/stats'),
        api.get('/api/admin/map/regions'),
        api.get('/api/admin/map/jobs'),
      ]);

      setStats(statsData);
      setRegions(regionsData || []);
      setJobs(jobsData || []);

      // If nothing selected yet, select Tashkent city or first region
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

  // Fetch GeoJSON boundaries file
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}uzbekistan_regions.geojson`)
      .then((res) => {
        if (!res.ok) throw new Error('GeoJSON file not found');
        return res.json();
      })
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.warn('Could not load uzbekistan_regions.geojson:', err));
  }, []);

  // Keep selectedRegion synced with regions list & init form values
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
      setFormNotes(r.notes || '');
    }
  }, [selectedRegionId, regions]);

  // Map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Uzbekistan center
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

  // Update tile layer when tileType changes
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

  // Click on map to pick center
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
        `Markaziy koordinata belgilandi: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
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

  // Render GeoJSON Region Boundaries
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

        if (isSelected) {
          return {
            color: '#2563eb',
            weight: 3.5,
            opacity: 1,
            fillColor: isActive ? '#3b82f6' : '#ef4444',
            fillOpacity: 0.28,
          };
        }

        if (!isActive) {
          return {
            color: '#ef4444',
            weight: 2,
            opacity: 0.9,
            dashArray: '5, 5',
            fillColor: '#f87171',
            fillOpacity: 0.22,
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

        featureLayer.bindTooltip(
          `<div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${regionName}</div>
            <div style="display: flex; gap: 8px; font-size: 11px;">
              <span style="color: ${isActive ? '#16a34a' : '#dc2626'}; font-weight: 600;">
                ${isActive ? '● Faol' : '● Nofaol'}
              </span>
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
              weight: 3,
              opacity: 1,
              fillOpacity: 0.35,
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

  // Render Radius Bounding Circle & Center Marker for Selected Region
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

    const circleColor = formActive ? '#2563eb' : '#dc2626';

    const circle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: circleColor,
      weight: 2,
      dashArray: '6, 6',
      fillColor: circleColor,
      fillOpacity: 0.12,
    }).addTo(map);

    circleLayerRef.current = circle;

    // Draggable center pin icon
    const centerIcon = L.divIcon({
      className: 'custom-center-pin',
      html: `<div style="
        width: 32px;
        height: 32px;
        background: ${formActive ? '#2563eb' : '#dc2626'};
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.35);
        cursor: grab;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
      </div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const marker = L.marker([lat, lng], {
      icon: centerIcon,
      draggable: true,
      title: `${selectedRegion.name} markazi (surishingiz mumkin)`,
    }).addTo(map);

    marker.bindTooltip(
      `<b>${selectedRegion.name}</b><br/>Radiusi: ${formRadiusKm} km (surib o‘zgartiring)`,
      { direction: 'top', offset: [0, -16] }
    );

    marker.on('dragend', (e) => {
      const pos = e.target.getLatLng();
      const nLat = Number(pos.lat.toFixed(5));
      const nLng = Number(pos.lng.toFixed(5));
      setFormCenterLat(nLat);
      setFormCenterLng(nLng);
      showToast(`Koordinatalar yangilandi: ${nLat}, ${nLng}`, 'info');
    });

    centerMarkerRef.current = marker;
  }, [
    selectedRegion,
    formCenterLat,
    formCenterLng,
    formRadiusKm,
    formActive,
    layers.radius,
  ]);

  // Render Job Markers on coordinates
  useEffect(() => {
    const group = jobMarkersGroupRef.current;
    if (!group) return;
    group.clearLayers();

    if (!layers.jobs || jobs.length === 0) return;

    jobs.forEach((job) => {
      if (!job.latitude || !job.longitude) return;

      const jobIcon = L.divIcon({
        className: 'custom-job-pin',
        html: `<div style="
          width: 28px;
          height: 28px;
          background: ${job.urgent ? '#ef4444' : '#059669'};
          border: 2px solid white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 3px 8px rgba(0,0,0,0.28);
          cursor: pointer;
        ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const paymentFormatted =
        job.payment != null
          ? Number(job.payment).toLocaleString('uz-UZ') + ' so‘m'
          : "Kelishuv bo'yicha";

      const popupHtml = `
        <div style="font-family: inherit; font-size: 13px; min-width: 200px; padding: 2px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #0f172a;">
            ${job.title || "Buyurtma"}
          </div>
          <div style="color: #059669; font-weight: 700; font-size: 13px; margin-bottom: 6px;">
            💰 ${paymentFormatted}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 4px;">
            📍 ${job.regionName || ''}${job.districtName ? ', ' + job.districtName : ''}
          </div>
          <div style="font-size: 12px; color: #475569; margin-bottom: 8px;">
            👤 ${job.employerName || 'Ish beruvchi'} ${job.employerPhone ? '(' + job.employerPhone + ')' : ''}
          </div>
          <a href="#/jobs?search=${encodeURIComponent(job.title || '')}" style="
            display: inline-block;
            background: #2563eb;
            color: white;
            text-decoration: none;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11.5px;
            font-weight: 600;
          ">Buyurtmani ko‘rish &rarr;</a>
        </div>
      `;

      const marker = L.marker([job.latitude, job.longitude], { icon: jobIcon });
      marker.bindPopup(popupHtml);
      group.addLayer(marker);
    });
  }, [jobs, layers.jobs]);

  // Center to whole Uzbekistan
  const resetToUzbekistan = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo([41.3775, 64.5853], 6, { duration: 1.2 });
  };

  // Center to selected region
  const zoomToRegion = (region) => {
    setSelectedRegionId(region.id);
    const map = mapInstanceRef.current;
    if (!map) return;

    if (region.centerLat && region.centerLng) {
      map.flyTo([region.centerLat, region.centerLng], 9, { duration: 1 });
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
        minSalaryRate: formMinSalaryRate ? Number(formMinSalaryRate) : null,
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

      // Refresh overall stats
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

  // Add District to Region
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

  // Update District Name
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
      showToast(`Tuman nomi o‘zgartirildi`, 'success');
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
        `"${districtName}" tumanini o‘chirishni tasdiqlaysizmi? (Agar bu tumanga bog‘langan e‘lonlar bo‘lsa, o‘chirib bo‘lmasligi mumkin)`
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

  // Filtered regions for dropdown or list
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
    <div className="space-y-5">
      {/* Header & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-line">
        <div>
          <h1 className="text-[22px] font-extrabold m-0 flex items-center gap-2.5">
            <MapIcon className="text-primary" size={24} />
            Xarita & Hududlarni boshqarish
          </h1>
          <p className="text-[13px] text-text-secondary mt-1 mb-0">
            Viloyatlarning operatsion chegaralari, xaritadagi faollik, koordinatalar va tumanlar nazorati
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn btn-secondary flex items-center gap-1.5 py-2 px-3 text-[13px]"
            title="Yangilash"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Yangilash
          </button>
          <button
            onClick={resetToUzbekistan}
            className="btn btn-secondary flex items-center gap-1.5 py-2 px-3 text-[13px]"
            title="Butun O‘zbekiston xaritasiga qaytish"
          >
            <Compass size={15} />
            O‘zbekiston markazi
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalRegions || 14}</div>
          <div className="stat-label">Jami hududlar</div>
          <div className="stat-trend text-primary font-medium">Barcha viloyatlar</div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-emerald-600">
            {stats?.activeRegions ?? 14}
          </div>
          <div className="stat-label">Faol hududlar</div>
          <div className="stat-trend text-emerald-600 font-medium">
            {stats?.restrictedRegions ? `${stats.restrictedRegions} ta cheklangan` : 'Barchasi ochiq'}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-blue-600">
            {stats?.jobsWithCoordinates || jobs.length}
          </div>
          <div className="stat-label">Xaritadagi e‘lonlar</div>
          <div className="stat-trend text-text-secondary">
            {stats?.totalJobs ? `Jami: ${stats.totalJobs} ta` : ''}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-value text-indigo-600">
            {stats?.totalDistricts || 208}
          </div>
          <div className="stat-label">Tuman / Shaharlar</div>
          <div className="stat-trend text-text-secondary">Ro‘yxatdan o‘tgan</div>
        </div>
      </div>

      {/* Map Toolbar Controls */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3">
        {/* Region selector & Search */}
        <div className="flex items-center gap-2.5 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-[280px]">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none"
            />
            <input
              type="text"
              placeholder="Viloyat yoki tuman qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-9 py-1.5 text-[13px] w-full"
            />
          </div>

          <select
            value={selectedRegionId || ''}
            onChange={(e) => {
              const r = regions.find((x) => x.id === Number(e.target.value));
              if (r) zoomToRegion(r);
            }}
            className="select py-1.5 text-[13px] max-w-[220px]"
          >
            {filteredRegions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {!r.active ? '(Nofaol)' : ''} ({r.jobsCount} ta ish)
              </option>
            ))}
          </select>
        </div>

        {/* Map Layers Toggles & Tile Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Selector */}
          <div className="flex items-center bg-bg rounded-[9px] p-0.5 border border-line text-[12px]">
            {Object.entries(TILE_PROVIDERS).map(([key, prov]) => (
              <button
                key={key}
                onClick={() => setTileType(key)}
                className={`px-2.5 py-1 rounded-[7px] font-medium transition-all ${
                  tileType === key
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                {prov.name}
              </button>
            ))}
          </div>

          {/* Layer toggles */}
          <div className="flex items-center gap-1.5 text-[12px]">
            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, boundaries: !prev.boundaries }))
              }
              className={`px-2.5 py-1.5 rounded-[8px] border font-medium flex items-center gap-1 transition-all ${
                layers.boundaries
                  ? 'border-primary/50 bg-primary/10 text-primary-text'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Layers size={13} /> Chegaralar
            </button>

            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, radius: !prev.radius }))
              }
              className={`px-2.5 py-1.5 rounded-[8px] border font-medium flex items-center gap-1 transition-all ${
                layers.radius
                  ? 'border-primary/50 bg-primary/10 text-primary-text'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Sliders size={13} /> Doira radiusi
            </button>

            <button
              onClick={() =>
                setLayers((prev) => ({ ...prev, jobs: !prev.jobs }))
              }
              className={`px-2.5 py-1.5 rounded-[8px] border font-medium flex items-center gap-1 transition-all ${
                layers.jobs
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700'
                  : 'border-line text-text-secondary opacity-60'
              }`}
            >
              <Briefcase size={13} /> E‘lonlar ({jobs.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Grid: Map + Region Management Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Map Container (7 cols on desktop) */}
        <div className="lg:col-span-7 card p-0 overflow-hidden relative shadow-sm border border-line">
          <div
            ref={mapContainerRef}
            className="w-full h-[580px] bg-slate-100 relative z-0"
          />

          {/* Map Helper overlay badge */}
          <div className="absolute top-3 right-3 z-[400] bg-surface/90 backdrop-blur-xs border border-line rounded-[10px] px-3 py-1.5 text-[11.5px] shadow-sm flex items-center gap-3">
            <span className="flex items-center gap-1 text-primary font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              Faol viloyat
            </span>
            <span className="flex items-center gap-1 text-danger font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-danger inline-block"></span>
              Cheklangan
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block"></span>
              E‘lon pinlari
            </span>
          </div>

          {/* Center pick helper prompt */}
          {isPickingCenter && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-primary text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
              <Crosshair size={16} />
              Yangi markazni belgilash uchun xarita ustiga bosing
              <button
                onClick={() => setIsPickingCenter(false)}
                className="ml-2 bg-white/20 hover:bg-white/30 rounded-full px-2 py-0.5 text-[11px]"
              >
                Bekor qilish
              </button>
            </div>
          )}
        </div>

        {/* Region & District Settings Drawer (5 cols on desktop) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedRegion ? (
            <div className="card space-y-4">
              {/* Region Header */}
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[18px] font-extrabold m-0 text-text">
                      {selectedRegion.name}
                    </h2>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        formActive
                          ? 'bg-emerald-500/15 text-emerald-700'
                          : 'bg-red-500/15 text-red-700'
                      }`}
                    >
                      {formActive ? 'FAOL' : 'NOFAOL'}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-text-secondary mt-1 mb-0 flex items-center gap-3">
                    <span>🏢 {selectedRegion.districtCount || 0} ta tuman</span>
                    <span>💼 {selectedRegion.jobsCount || 0} ta faol ish</span>
                    <span>👷 {selectedRegion.workersCount || 0} ta ishchi</span>
                  </p>
                </div>

                <button
                  onClick={handleSaveRegion}
                  disabled={saving}
                  className="btn btn-primary flex items-center gap-1.5 py-2 px-3.5 text-[13px] font-bold shrink-0"
                >
                  <Save size={15} />
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>

              {/* Status Toggles Section */}
              <div className="bg-bg/60 rounded-[12px] p-3.5 border border-line space-y-3">
                <div className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                  Operatsion chegaralash & Ruxsatlar
                </div>

                {/* Active Platform switch */}
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">
                      Viloyat tizimda faol
                    </div>
                    <div className="text-[11.5px] text-text-secondary">
                      Agar o‘chirilsa, xaritada cheklangan deb ko‘rsatiladi
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </label>

                {/* Allow Jobs switch */}
                <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">
                      E‘lon berishga ruxsat
                    </div>
                    <div className="text-[11.5px] text-text-secondary">
                      Ish beruvchilar yangi buyurtma joylay oladi
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formAllowJobs}
                    onChange={(e) => setFormAllowJobs(e.target.checked)}
                    className="w-4 h-4 accent-primary cursor-pointer"
                  />
                </label>

                {/* Allow Workers switch */}
                <label className="flex items-center justify-between cursor-pointer select-none pt-2 border-t border-line/60">
                  <div>
                    <div className="text-[13.5px] font-semibold text-text">
                      Ishchilar ro‘yxatdan o‘tishi
                    </div>
                    <div className="text-[11.5px] text-text-secondary">
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

              {/* Geographic Center & Bounding Radius */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                    Hudud markazi va doiraviy qamrovi
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPickingCenter(!isPickingCenter)}
                    className={`text-[12px] font-semibold px-2 py-1 rounded-[6px] border flex items-center gap-1 ${
                      isPickingCenter
                        ? 'bg-primary text-white border-primary'
                        : 'border-line text-primary hover:bg-primary/10'
                    }`}
                  >
                    <Crosshair size={13} />
                    {isPickingCenter ? 'Tanlanmoqda...' : 'Xaritadan tanlash'}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11.5px] text-text-secondary block mb-1">
                      Kenglik (Latitude)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formCenterLat}
                      onChange={(e) => setFormCenterLat(e.target.value)}
                      className="input text-[13px] py-1.5 w-full"
                    />
                  </div>
                  <div>
                    <label className="text-[11.5px] text-text-secondary block mb-1">
                      Uzunlik (Longitude)
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formCenterLng}
                      onChange={(e) => setFormCenterLng(e.target.value)}
                      className="input text-[13px] py-1.5 w-full"
                    />
                  </div>
                </div>

                {/* Radius Slider */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11.5px] text-text-secondary">
                      Qamrov radiusi (Chegaralash):
                    </label>
                    <span className="text-[13px] font-bold text-primary">
                      {formRadiusKm} km ({Math.round(formRadiusKm * 1000)} m)
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
                  <div className="flex justify-between text-[10.5px] text-text-secondary mt-1">
                    <span>5 km</span>
                    <span>100 km</span>
                    <span>220 km</span>
                  </div>
                </div>

                {/* Minimal salary rate */}
                <div>
                  <label className="text-[11.5px] text-text-secondary block mb-1">
                    Tavsiya etilgan minimal stavka (so‘m/kun):
                  </label>
                  <input
                    type="number"
                    placeholder="Masalan: 100 000"
                    value={formMinSalaryRate}
                    onChange={(e) => setFormMinSalaryRate(e.target.value)}
                    className="input text-[13px] py-1.5 w-full"
                  />
                </div>

                {/* Admin notes */}
                <div>
                  <label className="text-[11.5px] text-text-secondary block mb-1">
                    Eslatma / Cheklov sababi:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Masalan: Markaziy zona, alohida tartibda xizmat ko‘rsatiladi..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="input text-[12.5px] py-1.5 w-full resize-none"
                  />
                </div>
              </div>

              {/* Districts Section */}
              <div className="pt-3 border-t border-line space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[12px] font-bold text-text-secondary uppercase tracking-[0.4px]">
                    Tuman va shaharlar ({selectedRegion.districts?.length || 0})
                  </div>
                </div>

                {/* Add new district form */}
                <form
                  onSubmit={handleAddDistrict}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Yangi tuman yoki shahar nomi..."
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className="input text-[13px] py-1.5 flex-1"
                  />
                  <button
                    type="submit"
                    disabled={districtActionLoading || !newDistrictName.trim()}
                    className="btn btn-secondary flex items-center gap-1 py-1.5 px-3 text-[12.5px] font-semibold"
                  >
                    <Plus size={15} /> Qo‘shish
                  </button>
                </form>

                {/* District List Scrollable */}
                <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 border border-line/60 rounded-[10px] p-2 bg-bg/40">
                  {selectedRegion.districts && selectedRegion.districts.length > 0 ? (
                    selectedRegion.districts.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between gap-2 p-1.5 px-2 rounded-[8px] hover:bg-surface border border-transparent hover:border-line text-[13px] group"
                      >
                        {editingDistrictId === d.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingDistrictName}
                              onChange={(e) =>
                                setEditingDistrictName(e.target.value)
                              }
                              className="input text-[12px] py-1 flex-1"
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
                              <Building2
                                size={14}
                                className="text-text-secondary shrink-0"
                              />
                              <span className="font-medium text-text truncate">
                                {d.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {d.jobsCount > 0 && (
                                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {d.jobsCount} ish
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  setEditingDistrictId(d.id);
                                  setEditingDistrictName(d.name);
                                }}
                                className="text-text-secondary hover:text-primary p-1 rounded transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteDistrict(d.id, d.name)
                                }
                                className="text-text-secondary hover:text-danger p-1 rounded transition-colors"
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
                    <div className="text-[12px] text-text-secondary text-center py-4">
                      Ushbu viloyatda tumanlar mavjud emas
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="card text-center py-12 text-text-secondary space-y-3">
              <MapPin size={36} className="mx-auto text-primary opacity-60" />
              <div className="font-semibold text-text">Viloyat tanlanmagan</div>
              <div className="text-[12.5px] max-w-[280px] mx-auto">
                Xaritadagi viloyat chegarasi ustiga bosing yoki yuqoridagi ro‘yxatdan tanlang.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
