import { Component } from 'react';
// Catches render crashes so the user sees a message instead of a black screen.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error(error); }
  render() {
    if (!this.state.error) return this.props.children;
    return <div className="state"><h3>Something broke on this page</h3><p>{this.state.error.message}</p>
      <a className="btn" href="/">Back to home</a></div>;
  }
}
