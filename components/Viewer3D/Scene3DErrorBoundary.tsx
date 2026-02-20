'use client';

import { Component, ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { hasError: boolean }

export default class Scene3DErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500 gap-3 p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p className="font-medium text-gray-700">3D-Vorschau nicht verfügbar</p>
          <p className="text-sm max-w-xs">
            WebGL konnte nicht initialisiert werden. Starte Chrome mit{' '}
            <code className="bg-gray-200 px-1 rounded text-xs">--use-gl=swiftshader</code>{' '}
            oder aktiviere GPU-Beschleunigung in den Browser-Einstellungen.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
