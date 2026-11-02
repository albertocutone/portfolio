export default function StationVideo({ video, active }) {
  const videoId = new URL(video.url).searchParams.get('v');
  return <figure className="station-video" aria-label={video.title}>
    <div className="station-video-player">{active && <iframe
      title={video.title}
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&playsinline=1&rel=0`}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />}</div>
    <figcaption><span>{video.title}</span><a href={video.url} target="_blank" rel="noreferrer">YouTube ↗</a></figcaption>
  </figure>;
}
