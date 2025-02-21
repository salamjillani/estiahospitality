import { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  state = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error Boundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg mt-4">
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p>{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}
ErrorBoundary.propTypes = {
  children: PropTypes.node
};

export default ErrorBoundary;
