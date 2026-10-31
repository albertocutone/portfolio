import { Component } from 'react';

export default class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() {
    if (this.state.failed) return <div className="scene-error" role="alert">
      <p>Scene assets could not be loaded.</p>
      <button type="button" onClick={() => window.location.reload()}>Retry scene</button>
    </div>;
    return this.props.children;
  }
}
