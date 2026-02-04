import { redirect } from 'next/navigation';

type RegisterPageProps = {
  searchParams?: {
    next?: string;
  };
};

export default function RegisterPage({ searchParams }: RegisterPageProps) {
  const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : undefined;
  const redirectTo = nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup';
  redirect(redirectTo);
}
