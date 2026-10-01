import Reveal from './Reveal.jsx';

/** The small label, heading and lead line every section opens with. */
export default function SectionHead({ eyebrow, title, text, align = 'center', tone = 'light' }) {
  const dark = tone === 'dark';
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <span
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${
          dark ? 'bg-white/10 text-brand-300' : 'bg-brand-100 text-brand-text'
        }`}
      >
        {eyebrow}
      </span>
      <h2
        className={`mt-5 font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-[2.6rem] ${
          dark ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      {text && <p className={`mt-4 text-[1.05rem] leading-relaxed ${dark ? 'text-navy-100/70' : 'text-navy-700/65'}`}>{text}</p>}
    </Reveal>
  );
}
