export default function StationVideo({ project, active }) {
  const videoId = new URL(project.video).searchParams.get('v');
  return <figure className="station-video" aria-label="DUNE experiment video">
    <div className="station-video-player">{active && <iframe
      title="DUNE experiment context video"
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />}</div>
    <figcaption><span>DUNE · experiment context</span><a href={project.video} target="_blank" rel="noreferrer">YouTube ↗</a></figcaption>
  </figure>;
}
