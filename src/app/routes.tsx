import { createBrowserRouter } from "react-router";
import { NotFound } from "./pages/NotFound";

// New canonical page imports
import LoginPage from "./LoginPage";
import MasterHomePage from "./MasterHomePage";
import AnalysisPage from "./AnalysisPage";
import AdminPricingPage from "./AdminPricingPage";
import UserDashboardPage from "./UserDashboardPage";
import WeatherPage from "./pages/WeatherPage";
import TerritorialIntelligencePage from "./pages/TerritorialIntelligencePage";
import CompetitorIntelligencePage from "./pages/CompetitorIntelligencePage";
import GovernancePage from "./pages/GovernancePage";
import PricingCodesPage from "./pages/PricingCodesPage";

// Old pages that still have unique functionality
import { Comparison } from "./pages/Comparison";
import { DetailedMetrics } from "./pages/DetailedMetrics";
import { PricingSimulator } from "./pages/PricingSimulator";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
    ErrorBoundary: NotFound,
  },
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/home",
    Component: MasterHomePage,
  },
  {
    path: "/analysis",
    Component: AnalysisPage,
  },
  {
    path: "/admin",
    Component: AdminPricingPage,
  },
  {
    path: "/dashboard",
    Component: UserDashboardPage,
  },
  {
    path: "/governance",
    Component: GovernancePage,
  },
  {
    path: "/pricing-codes",
    Component: PricingCodesPage,
  },
  {
    path: "/comparison/:plaza1/:plaza2",
    Component: Comparison,
  },
  {
    path: "/metrics",
    Component: DetailedMetrics,
  },
  {
    path: "/simulator",
    Component: PricingSimulator,
  },
  {
    path: "/weather",
    Component: WeatherPage,
  },
  {
    path: "/territorial",
    Component: TerritorialIntelligencePage,
  },
  {
    path: "/competitor",
    Component: CompetitorIntelligencePage,
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
