import { DashboardClient } from './DashboardClient';

export default function DashboardPage() {
  const hasTamboKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);

  return <DashboardClient hasTamboKey={hasTamboKey} />;
}
