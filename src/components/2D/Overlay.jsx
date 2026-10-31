import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { profile, stations } from '../../config/stations.js';
import { resolveTimeline } from '../../scroll/timeline.js';
import { stationLanding } from '../../config/motion.js';

export default function Overlay({ store, onModalChange }) {
  const offset = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const timeline = resolveTimeline(offset, stations);
  const { station, index, cardOpacity } = timeline;
  const [details, setDetails] = useState(null);
  const dialog = useRef();
  const trigger = useRef();
  const canInteract = cardOpacity > 0.95;

  useEffect(() => {
    if (!details) return;
    dialog.current.showModal();
    dialog.current.scrollTop = 0;
  }, [details]);

  function close() {
    dialog.current.close();
    afterClose();
  }

  function afterClose() {
    if (dialog.current.open) return;
    setDetails(null);
    onModalChange(false);
    trigger.current?.focus({ preventScroll: true });
  }

  return <><div className="scene-transition" aria-hidden="true" style={{ opacity: 1 - timeline.sceneOpacity }} /><div className="overlay">
    <header className="masthead">
      <a className="identity" href="#" onClick={(event) => { event.preventDefault(); store.seek(0); }} aria-label="Alberto Cutone, back to start">
        <span className="monogram" aria-hidden="true">ac<span>.</span></span>
        <span>{profile.name}<small>HARDWARE / SOFTWARE / PERCEPTION</small></span>
      </a>
      <span className="edition">AN EXPLORATION ACROSS THE STACK<span className="status-dot" /></span>
    </header>

    <main className="narrative" aria-label="Portfolio stations">
      <article className="station-card" data-station={station.id} style={{ opacity: cardOpacity }} inert={!canInteract} aria-hidden={!canInteract}>
        <p className="eyebrow">{station.eyebrow}</p>
        <p className="affiliation"><span />{station.badge}</p>
        <h1>{station.title.split('\n').map((line, i) => <span key={line} className={i === 1 ? 'title-accent' : ''}>{line}</span>)}</h1>
        <p className="role">{station.role}</p>
        <p className="description">{station.description}</p>
        <div className="tags" aria-label="Technologies">{station.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <button ref={trigger} className="details-button" onClick={() => { onModalChange(true); setDetails(station); }}>View details <span aria-hidden="true">&#8599;</span></button>
        {(profile.cv || profile.contact) && <div className="optional-actions">
          {profile.cv && <a href={`${import.meta.env.BASE_URL}${profile.cv}`}>Download CV</a>}
          {profile.contact && <a href={profile.contact}>Contact</a>}
        </div>}
      </article>
    </main>

    <aside className="scene-caption" aria-hidden="true"><span className="caption-cross">+</span><div>{station.eyebrow.slice(5)}<small>{station.scene === 'atlas' ? 'ATLAS DETECTOR STUDY / LIVE WEBGL' : 'PCB COMPONENT STUDY / LIVE WEBGL'}</small></div></aside>
    {station.scene === 'atlas' && <a className="model-credit" href="https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd" target="_blank" rel="noreferrer">ATLAS model: physics.atlas.vr · CC BY 4.0 · adapted</a>}
    <footer className="flight-footer">
      <div className="scroll-cue"><span aria-hidden="true">&#8595;</span><div>Scroll to explore<small>FIVE STATIONS. ONE CONNECTED SYSTEM.</small></div></div>
      <nav aria-label="Station navigation">{stations.map((item, i) => <button key={item.id} aria-label={item.label} aria-current={i === index ? 'step' : undefined} onClick={() => store.seek(stationLanding(stations, i))}><span className="nav-number">0{i + 1}</span><span className="nav-label">{item.label}</span><span className="nav-line" /></button>)}</nav>
      <span className="flight-position" aria-label="Flight progress">{String(Math.round(offset * 100)).padStart(3, '0')}<small> / 100</small></span>
    </footer>
    <div className="progress-track" aria-hidden="true"><div style={{ transform: `scaleX(${offset})` }} /></div>

    <dialog ref={dialog} aria-labelledby="detail-title" onClose={afterClose} onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="dialog-heading"><p className="eyebrow">PROJECT NOTES / {details?.eyebrow.slice(0, 2)}</p><button className="close-button" aria-label="Close details" onClick={close}>Close <span aria-hidden="true">&#215;</span></button></div>
      <h2 id="detail-title">{details?.badge}</h2>
      <p className="dialog-role">{details?.role}</p>
      {details?.projects.map((project, i) => <section className="project" key={project.title}><span className="project-number">0{i + 1}</span><div><h3>{project.title}</h3><p>{project.body}</p>{project.link && <a href={project.link} target="_blank" rel="noreferrer">Explore project</a>}</div></section>)}
      <p className="dialog-note">Part of the journey from photons to edge intelligence.</p>
    </dialog>
  </div></>;
}
