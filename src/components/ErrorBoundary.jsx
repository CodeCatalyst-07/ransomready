import { Component } from 'react';

// Only the page is replaced; navigation stays available after a rendering error.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('RansomReady page error:', error, info);
  }

  render() {
    if (this.state.hasError) return <section className="card detail-card" role="alert">
      <h2>Something went wrong on this page</h2>
      <p>Your saved data is safe. Try this page again or return to Home.</p>
      <div>
        <button className="primary-button" onClick={() => this.setState({ hasError: false })}>Try again</button>{' '}
        <button className="primary-button" onClick={() => this.props.navigate('home')}>Go to Home</button>
      </div>
    </section>;
    return this.props.children;
  }
}
