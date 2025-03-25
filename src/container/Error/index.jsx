import PropTypes from 'prop-types'
import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      message: '',
      customMessage: props.customMessage || ''
    }
  }
  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, message: error.message }
  }
  // eslint-disable-next-line
  componentDidCatch(error, errorInfo, customMessage) {
    // eslint-disable-next-line
    console.log(error, errorInfo, customMessage)
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo)
  }
  componentDidMount() {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line
    }
  }
  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <h1>{ process.env.NODE_ENV === 'development' && this.state.customMessage || this.state.message || 'Ha ocurrido un error'}</h1>
    }
    return this.props.children
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.any,
  customMessage: PropTypes.string
}
export default ErrorBoundary