import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Ошибка:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return <h2 style={{textAlign:'center', marginTop:'50px'}}>Что-то пошло не так. Перезагрузите страницу.</h2>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;