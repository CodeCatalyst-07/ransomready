import { ChartPie } from 'lucide-react';
import PlaceholderPage from '../components/PlaceholderPage.jsx';

export default function DashboardPage() {
  return <PlaceholderPage icon={ChartPie} title="Your readiness at a glance" phase={6}
    description="Readiness results and charts will help you understand your organisation’s strengths and gaps." />;
}
