"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your Email</CardTitle>
          <CardDescription>Check your inbox for a verification email</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification email to your inbox. Please click the link in the email to verify your account and activate your collaboration workspace.
          </p>
          <p className="mt-4 text-muted-foreground">
            If you don&apos;t see the email, please check your spam folder.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button asChild className="w-full">
            <Link href="/auth/signin">Continue to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}