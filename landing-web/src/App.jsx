import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import TwoSides from './components/TwoSides.jsx';
import Features from './components/Features.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Coverage from './components/Coverage.jsx';
import Roadmap from './components/Roadmap.jsx';
import Footer from './components/Footer.jsx';
import { useAppSettings, useCoverage, useLandingData } from './hooks/useLandingData.js';

const FALLBACK_ABOUT =
  "Ishchi — O'zbekiston bo'ylab ish beruvchi va ishchini bevosita bog'laydigan zamonaviy platforma.";

export default function App() {
  const landing = useLandingData();
  const settings = useAppSettings();
  const { regions, professions } = useCoverage();

  const botUrl = settings?.telegramBotUsername ? `https://t.me/${settings.telegramBotUsername}` : 'https://t.me/';

  return (
    <div className="min-h-screen bg-white">
      <Nav />
      <main>
        <Hero data={landing} botUrl={botUrl} />
        <About aboutText={settings?.aboutText || FALLBACK_ABOUT} />
        <TwoSides />
        <Features features={landing.features} />
        <HowItWorks />
        <Coverage regions={regions} professions={professions} />
        <Roadmap items={landing.roadmap} />
      </main>
      <Footer settings={settings} botUrl={botUrl} />
    </div>
  );
}
