import * as React from 'react'

export class ErrorBoundary extends React.Component<
  unknown,
  { hasError: boolean }
> {
  constructor(props: unknown) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_error: unknown): { hasError: boolean } {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  componentDidCatch(error: unknown, errorInfo: unknown): void {
    // You can also log the error to an error reporting service
    console.log(error, errorInfo)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <p>Something went wrong.</p>
    }

    return this.props.children
  }
}
