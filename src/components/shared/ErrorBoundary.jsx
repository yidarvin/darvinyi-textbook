import { Component } from "react";

// ─── Generic error boundary — catches render-time throws in its subtree
// (including a lazy-loaded chunk that failed to fetch, since React re-throws
// that rejection during the render that resumes after Suspense) and renders
// `fallback` instead of unmounting everything above it. ────────────────────
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
