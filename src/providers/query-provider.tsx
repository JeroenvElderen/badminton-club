import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export default function RiversideQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: 10 * 60_000,
            retry: 1,
            refetchOnMount: true,
            refetchOnReconnect: true,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
