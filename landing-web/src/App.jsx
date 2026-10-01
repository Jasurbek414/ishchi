import Nav from './components/Nav.jsx';
import Hero from './components/Hero.jsx';
import Categories from './components/Categories.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import Features from './components/Features.jsx';
import TelegramBand from './components/TelegramBand.jsx';
import Coverage from './components/Coverage.jsx';
import Faq from './components/Faq.jsx';
import DownloadCta from './components/DownloadCta.jsx';
import Footer from './components/Footer.jsx';
import { useAppSettings, useCoverage, useLandingData } from './hooks/useLandingData.js';

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
        <Categories professions={professions} />
        <HowItWorks />
        <Features features={landing.features} />
        <TelegramBand botUrl={botUrl} />
        <Coverage regions={regions} />
        <Faq />
        <DownloadCta botUrl={botUrl} />
      </main>
      <Footer settings={settings} botUrl={botUrl} />
    </div>
  );
}
