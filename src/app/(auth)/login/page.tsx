import Link from 'next/link';
import { KeyRound } from 'lucide-react';

import { loginAction } from '@/app/actions/auth';
import { Reveal } from '@/components/motion/Reveal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type LoginPageProps = {
  searchParams?: {
    next?: string;
    error?: string;
  };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  const nextPath = typeof searchParams?.next === 'string' ? searchParams.next : '/dashboard';
  const error = typeof searchParams?.error === 'string' ? searchParams.error : null;
  const errorMessage =
    error === 'invalid_email'
      ? 'Please enter a valid Email address.'
      : error === 'invalid' || error === 'invalid_name' || error === 'invalid_password'
        ? 'Invalid email or password.'
      : error === 'server'
        ? 'Login is temporarily unavailable. Please try again.'
        : null;

  return (
    <Reveal className="w-full max-w-md">
      <Card terminal className="border-primary/20 bg-white/5 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <KeyRound className="h-5 w-5 text-primary" />
            Log in
          </CardTitle>
          <CardDescription>Enter your Email and Password to access the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            {errorMessage ? (
              <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </p>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium leading-none">
                Email
              </label>
              <Input
                id="email"
                name="email"
                placeholder="e.g. leia@holocron.academy"
                autoComplete="email"
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium leading-none">
                Password
              </label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>

            <Button type="submit" className="w-full">
              Log in
            </Button>

            <p className="text-sm text-muted-foreground">
              New here?{' '}
              <Link
                href={`/signup?next=${encodeURIComponent(nextPath)}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </Reveal>
  );
}
