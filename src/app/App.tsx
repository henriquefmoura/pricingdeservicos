import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from './components/ui/sonner';
import { Analytics } from '@vercel/analytics/react';
import { PricingMentorWidget } from './components/pricing-mentor/PricingMentorWidget';

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <PricingMentorWidget />
      <Toaster />
      <Analytics />
    </>
  );
}