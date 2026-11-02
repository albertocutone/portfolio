export default function ModelCredit({ scene, className = 'model-credit' }) {
  if (scene === 'colosseum') return <p className={className}>“<a href="https://skfb.ly/orOMD" target="_blank" rel="noreferrer">Colosseum, Rome, Italy</a>” by Brian Trepanier is licensed under <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">Creative Commons Attribution 4.0</a>. Adapted for this scene.</p>;
  if (scene === 'atlas') return <p className={className}><a href="https://sketchfab.com/3d-models/cern-atlas-detector-c3761776d4f94b3eb77336896da2a3bd" target="_blank" rel="noreferrer">ATLAS model: physics.atlas.vr</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a> · adapted</p>;
  return null;
}
