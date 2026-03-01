// Graceful error handling component
// TODO: Catch rendering errors
// TODO: Show friendly error message with retry option

'use client';

export default function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
