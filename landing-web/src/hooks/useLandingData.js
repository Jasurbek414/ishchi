import { useEffect, useState } from 'react';
import { getJson } from '../lib/api.js';

const FALLBACK_LANDING = {
  heroTitle: "Ishchi va ish beruvchini bevosita bog'laydi",
  heroSubtitle:
    "Mardikor, usta va mutaxassisni ish beruvchi bilan vositachisiz uchrashtiradigan mobil platforma.",
  stats: [
    { value: '14', label: 'viloyat qamrovi' },
    { value: '26+', label: 'kasb toifasi' },
    { value: '2', label: "rol — bitta akkaunt" },
    { value: "0 so'm", label: "ro'yxatdan o'tish" },
  ],
  features: [],
  roadmap: [],
};

export function useLandingData() {
  const [data, setData] = useState(FALLBACK_LANDING);
  useEffect(() => {
    getJson('/api/landing').then(setData).catch(() => {});
  }, []);
  return data;
}

export function useAppSettings() {
  const [settings, setSettings] = useState(null);
  useEffect(() => {
    getJson('/api/app-settings').then(setSettings).catch(() => {});
  }, []);
  return settings;
}

export function useCoverage() {
  const [regions, setRegions] = useState([]);
  const [professions, setProfessions] = useState([]);
  useEffect(() => {
    getJson('/api/regions').then(setRegions).catch(() => {});
    getJson('/api/professions').then(setProfessions).catch(() => {});
  }, []);
  return { regions, professions };
}
