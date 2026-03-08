import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/api';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const token = searchParams.get('token');

  useEffect(() => {
    async function verify() {
      if (!token) {
        setStatus('error');
        return;
      }
      try {
        await api.get(`/auth/verify-email?token=${token}`);
        setStatus('success');
      } catch {
        setStatus('error');
      }
    }
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-3xl font-bold">DevHive</h1>
        {status === 'verifying' && (
          <p className="text-muted-foreground">Verifying your email...</p>
        )}
        {status === 'success' && (
          <div className="space-y-4">
            <p className="text-green-600 font-medium">Email verified successfully.</p>
            <Link
              to="/login"
              className="inline-block text-sm underline underline-offset-4"
            >
              Sign in to your account
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="space-y-4">
            <p className="text-destructive font-medium">
              Invalid or expired verification link.
            </p>
            <Link
              to="/login"
              className="inline-block text-sm underline underline-offset-4"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailPage;