import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { PricingMentorWidget } from './components/pricing-mentor/PricingMentorWidget';
import { AppInitializer } from './components/AppInitializer';

export default function App() {
  return (
    <>
      <AppInitializer />
      <RouterProvider router={router} />
      <PricingMentorWidget />
      <Toaster />
      <Analytics />
    </>
  );
}