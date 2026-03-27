import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { CheckCircle, BookOpen, ArrowRight } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  return (
    <Layout>
      <div className="px-4 pt-12 pb-8 max-w-lg mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground mb-2">Payment Successful</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {user
            ? "Your books have been unlocked and are ready to read!"
            : "We've sent you an email to set your password and access your books."}
        </p>

        {user ? (
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Go to My Library
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth')}
              className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button transition-all duration-200 active:scale-[0.97] flex items-center justify-center gap-2"
            >
              Sign In to Access Books
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-xs text-muted-foreground">
              Check your email for a link to set your password.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
