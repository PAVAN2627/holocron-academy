import Link from 'next/link';
import { UserPlus } from 'lucide-react';

import { signupAction } from '@/app/actions/auth';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type SignupPageProps = {
  searchParams?: {
    next?: string;
    error?: string;
  };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : '/dashboard';
  const error = typeof searchParams?.error === 'string' ? searchParams.error : null;
  const errorMessage =
    error === 'exists'
      ? 'An account with that Full Name already exists. Try logging in instead.'
      : error === 'server'
        ? 'Signup is temporarily unavailable. Please try again.'
        : error === 'invalid'
          ? 'Please fill out all fields to create your account.'
          : null;

  return (
    <Reveal className="w-full max-w-md">
      <Card terminal className="border-primary/20 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />
            Sign up
          </CardTitle>
          <CardDescription>Create your profile to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signupAction} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            {errorMessage ? (
              <p className="rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">
                {errorMessage}
              </p>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="fullName" className="text-sm font-medium leading-none">
                Full Name
              </label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="e.g. Luke Skywalker"
                autoComplete="name"
                maxLength={80}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="classYear" className="text-sm font-medium leading-none">
                Class/Year
              </label>
              <Input
                id="classYear"
                name="classYear"
                placeholder="e.g. Year 2 (IT)"
                autoComplete="organization-title"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input id="password" name="password" type="password" autoComplete="new-password" required />
            </div>

            <Button type="submit" className="w-full">
              Create account
            </Button>

            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link
                href={`/login?next=${encodeURIComponent(nextPath)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </Reveal>
  );
}
