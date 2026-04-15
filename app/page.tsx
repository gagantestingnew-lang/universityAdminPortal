"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'error' | 'success' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setStatus('');
    setIsLoading(true);

    console.log(`${isSignUp ? 'Signing up' : 'Logging in'} with email:`, email);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) {
          setStatus('error');
          setMessage(signUpError.message);
          console.error('Signup failed:', signUpError);
        } else {
          setStatus('success');
          setMessage('Account created successfully! Please check your email to confirm your account.');
          console.log('Signup successful:', signUpData);
        }
      } else {
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log('Login response:', { loginData, loginError });

        if (loginError || !loginData.session) {
          setStatus('error');
          setMessage(loginError?.message ?? 'Login failed.');
          console.error('Login failed:', loginError);
        } else {
          console.log('Login successful, redirecting to dashboard');
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setStatus('error');
      setMessage('An unexpected error occurred.');
      console.error('Auth error:', err);
    }

    setIsLoading(false);
  };

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="brand-bar">
          <div className="brand-logo">
            <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>FU</span>
          </div>
          <div>
            <h1>Admin portal</h1>
            <p className="portal-subtitle">Fireflink University</p>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Processing…' : isSignUp ? 'Sign Up' : 'Log In'}
          </button>

          <div className="helper-row">
            <label className="remember-me">
              <input type="checkbox" /> Remember me
            </label>
            <button
              type="button"
              className="forgot-link"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {isSignUp ? 'Already have an account? Log In' : 'Need an account? Sign Up'}
            </button>
          </div>

          {message ? (
            <div className={`message-box ${status === 'error' ? 'error-text' : 'success-text'}`}>
              {message}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
