import { cookies } from 'next/headers';

import { DashboardClient } from './DashboardClient';

import { HOLOCRON_PROFILE_COOKIE, parseHolocronProfile } from '@/lib/holocron-auth';

export default function DashboardPage() {
  const hasTamboKey = Boolean(process.env.NEXT_PUBLIC_TAMBO_API_KEY);
  const profile = parseHolocronProfile(cookies().get(HOLOCRON_PROFILE_COOKIE)?.value);

  return <DashboardClient hasTamboKey={hasTamboKey} profile={profile} />;
}
