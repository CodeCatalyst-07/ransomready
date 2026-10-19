import { House, ClipboardList, ChartPie, Radar, FileText, Info } from 'lucide-react';
import HomePage from '../pages/HomePage.jsx';
import AssessmentPage from '../pages/AssessmentPage.jsx';
import DashboardPage from '../pages/DashboardPage.jsx';
import ScannerPage from '../pages/ScannerPage.jsx';
import ReportsPage from '../pages/ReportsPage.jsx';
import AboutPage from '../pages/AboutPage.jsx';

// Add a page here to register both its navigation button and its component.
export const navigation = [
  { id: 'home', label: 'Home', icon: House, component: HomePage },
  { id: 'assessment', label: 'Assessment', icon: ClipboardList, component: AssessmentPage },
  { id: 'dashboard', label: 'Dashboard', icon: ChartPie, component: DashboardPage },
  { id: 'scanner', label: 'Scanner', icon: Radar, component: ScannerPage },
  { id: 'reports', label: 'Reports', icon: FileText, component: ReportsPage },
  { id: 'about', label: 'About', icon: Info, component: AboutPage },
];
