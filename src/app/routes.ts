import { createBrowserRouter } from "react-router";
import Dashboard from "./pages/Dashboard";
import Activity from "./pages/Activity";
import Agents from "./pages/Agents";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";

export const router = createBrowserRouter([
  { path: "/", Component: Dashboard },
  { path: "/activity", Component: Activity },
  { path: "/agents", Component: Agents },
  { path: "/analytics", Component: Analytics },
  { path: "/settings", Component: Settings },
  { path: "/chat", Component: Chat },
]);
