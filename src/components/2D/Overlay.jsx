import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { stations } from '../../config/stations.js';
import { resolveTimeline } from '../../scroll/timeline.js';
import { stationLanding } from '../../config/motion.js';
import { getStationContent } from '../../content/stationContent.js';
import PortfolioWindow from './PortfolioWindow.jsx';
import StationDetails from './StationDetails.jsx';
import ModelCredit from './ModelCredit.jsx';
import StationVideo from './StationVideo.jsx';
import ContactForm from './ContactForm.jsx';
import { profile, projects, education, experiences, stationDescriptions, stationVideos } from '../../config/portfolio.js';

export default function Overlay({ store, onModalChange }) {
  const offset = useSyncExternalStore(store.subscribe, store.getSnapshot);
  const timeline = resolveTimeline(offset, stations);
  const { station, index, cardOpacity } = timeline;
  const content = getStationContent(station, { projects, education, experiences });
  const [details, setDetails] = useState(null);
  const dialog = useRef();
  const trigger = useRef();
  const canInteract = cardOpacity > 0.95;
  const general = station.kind === 'intro' || station.kind === 'recap';
  const videoProject = content.projects.find(project => project.video && project.station === station.id);
  const video = canInteract ? stationVideos[station.id] ?? (videoProject ? { url: videoProject.video, title: videoProject.videoTitle } : null) : null;

  function openWorkspace(view, project, event) {
    // Keep the original station button as the return target when opening a
    // project from inside its details dialog.
    if (!dialog.current.open) trigger.current = event.currentTarget;
    onModalChange(true);
    setDetails({ workspace: true, view, project });
  }

  function openContact(event) {
    if (!dialog.current.open) trigger.current = event.currentTarget;
    onModalChange(true);
    setDetails({ contact: true });
  }

  useEffect(() => {
    if (!details) return;
    if (!dialog.current.open) dialog.current.showModal();
    dialog.current.scrollTop = 0;
  }, [details]);

  function close() { dialog.current.close(); afterClose(); }
  function afterClose() {
    if (dialog.current.open) return;
    setDetails(null);
    onModalChange(false);
    trigger.current?.focus({ preventScroll: true });
  }
  function seek(id) { store.seek(stationLanding(stations, stations.findIndex(item => item.id === id))); }
  function openStation(event) {
    trigger.current = event.currentTarget;
    onModalChange(true);
    setDetails(station);
  }

  return <><div className="scene-transition" aria-hidden="true" style={{ opacity: 1 - timeline.sceneOpacity }} /><div className="overlay">
    <header className="masthead">
      <a className="identity" href="#" onClick={event => { event.preventDefault(); store.seek(0); }} aria-label="Alberto Cutone, back to start">
        <span className="monogram" aria-hidden="true">ac<span>.</span></span>
        <span>{profile.name}<small>HARDWARE / SOFTWARE / PERCEPTION</small></span>
      </a>
      <div className="header-actions"><button type="button" onClick={event => openWorkspace('projects', null, event)}>🗂️ Projects</button><button type="button" onClick={event => openWorkspace('experience', null, event)}>💼 Experience</button><button type="button" onClick={event => openWorkspace('about', null, event)}>👋 About</button></div>
    </header>

    <main className={`narrative${general ? ' narrative-general' : ''}${video ? ' narrative-media' : ''}`} aria-label="Portfolio stations" data-scroll-panel={video ? '' : undefined} tabIndex={video ? 0 : undefined}>
      {video && <StationVideo video={video} active={!details} />}
      <article className="station-card" data-station={station.id} data-pose={station.pose} style={{ opacity: cardOpacity }} inert={!canInteract} aria-hidden={!canInteract}>
        <p className="eyebrow">{station.eyebrow}</p>
        <p className="affiliation"><span />{station.badge}</p>
        <h1>{station.title.split('\n').map((line, i) => <span key={line} className={i === 1 ? 'title-accent' : ''}>{line}</span>)}</h1>
        <p className="role">{station.role}</p>
        <p className="description">{stationDescriptions[station.id]}</p>
        {station.kind === 'intro' && <div className="pitch-pillars" aria-label="What I bring"><span>Native performance</span><span>Embedded systems</span><span>Perceptual tools</span></div>}
        {!general && <>
          <div className="station-context" aria-label={station.kind === 'education' ? 'Education highlights' : 'Related experience'}>
            {content.education.map(item => <p className="degree-preview" key={item.title}><strong>{item.emoji} {item.title}</strong><span>{item.school} · {item.location}</span></p>)}
            {station.kind === 'experience' && content.experiences.map(item => <div className="experience-preview" key={item.id}><strong>{item.role}</strong><span>{item.dates} · {item.location}</span>{item.note && <small>{item.note}</small>}</div>)}
          </div>
          <div className="station-projects" aria-label="Related projects">{content.projects.map(project => <button type="button" className={`station-project tone-${project.color}`} key={project.id} onClick={event => openWorkspace('projects', project.id, event)}><span aria-hidden="true">{project.emoji}</span><span><strong>{project.title}</strong><small>{project.summary}</small></span><span aria-hidden="true">↗</span></button>)}</div>
          <div className="tags" aria-label="Technologies">{station.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        </>}
        {station.kind === 'recap' && <>
          <div className="recap-facts" aria-label="Journey recap"><span><strong>{education.length}</strong> engineering degrees</span><span><strong>{experiences.filter(item => item.id !== 'cardiac').length}</strong> industry roles</span><span><strong>{projects.length}</strong> projects</span></div>
          <div className="station-launchpad" aria-label="Featured projects">{station.featuredProjectIds.map(id => { const project = projects.find(item => item.id === id); return <button type="button" key={id} className={`launchpad-item tone-${project.color}`} onClick={event => openWorkspace('projects', id, event)}><span aria-hidden="true">{project.emoji}</span><strong>{project.title}</strong><small>{project.organization}</small></button>; })}</div>
        </>}
        {station.kind === 'intro' ? <button type="button" className="details-button" onClick={() => seek('education')}>Start my CV <span aria-hidden="true">→</span></button>
          : <button type="button" className="details-button" onClick={station.kind === 'recap' ? event => openWorkspace('projects', null, event) : openStation}>View details <span aria-hidden="true">↗</span></button>}
        <div className="optional-actions">
          {station.kind === 'recap' && <button type="button" onClick={event => openWorkspace('experience', null, event)}>Full experience ↗</button>}
          <button type="button" onClick={openContact}>✉️ Let's talk</button>
          <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          <a className="secondary-profile" href={profile.leetcode} target="_blank" rel="noreferrer">LeetCode ↗</a>
        </div>
      </article>
    </main>

    {!general && <aside className="scene-caption" aria-hidden="true"><span className="caption-cross">+</span><div>{station.label}<small>{station.poseLabel.toUpperCase()} / LIVE WEBGL</small></div></aside>}
    <ModelCredit scene={station.scene} />
    <footer className="flight-footer">
      <div className="scroll-cue"><span aria-hidden="true">↓</span><div>Scroll to explore<small>INTRO. CV. RECAP.</small></div></div>
      <nav aria-label="Station navigation">{stations.map((item, i) => <button type="button" key={item.id} aria-label={item.label} aria-current={i === index ? 'step' : undefined} onClick={() => store.seek(stationLanding(stations, i))}><span className="nav-number">{String(i + 1).padStart(2, '0')}</span><span className="nav-label">{item.label}</span><span className="nav-line" /></button>)}</nav>
      <span className="flight-position" aria-label="Flight progress">{String(Math.round(offset * 100)).padStart(3, '0')}<small> / 100</small></span>
    </footer>
    <div className="progress-track" aria-hidden="true"><div style={{ transform: `scaleX(${offset})` }} /></div>

    <dialog ref={dialog} className={details?.workspace ? 'workspace-dialog' : 'station-dialog'} aria-labelledby="detail-title" onClose={afterClose} onCancel={event => { event.preventDefault(); close(); }}>
      <div className="dialog-heading"><p className="eyebrow">{details?.contact ? 'CONTACT' : details?.workspace ? 'ALBERTO’S DESKTOP / EXPLORE & DISCOVER' : `CV / ${details?.label ?? ''}`}</p><button type="button" className="close-button" aria-label="Close details" onClick={close}>Close <span aria-hidden="true">×</span></button></div>
      {details?.contact ? <ContactForm /> : details?.workspace ? <PortfolioWindow key={`${details.view}:${details.project}`} initialView={details.view} initialProject={details.project} onContact={openContact} /> : details && <StationDetails station={details} onOpenProject={(id, event) => openWorkspace('projects', id, event)} />}
    </dialog>
  </div></>;
}
