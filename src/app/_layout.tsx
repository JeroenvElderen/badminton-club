import RiversideQueryProvider from '@/providers/query-provider';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <RiversideQueryProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: '#001B17',
          },
        }}
      />
      <StatusBar style="light" />
    </RiversideQueryProvider>
  );
}
