import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  UserPlus,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../stores/useAuthStore';
import { Input } from '../components/auth/Input';

export default function Register() {
  const navigate = useNavigate();

  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const clientError = useMemo(() => {
    if (!name.trim()) return 'Name is required.';
    if (name.trim().length < 2) return 'Name must be at least 2 characters.';
    if (!email.trim()) return 'Email is required.';
    if (!email.includes('@')) return 'Enter a valid email.';
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (confirm !== password) return 'Passwords do not match.';
    return null;
  }, [name, email, password, confirm]);

  const showClientError = submitted ? clientError : null;

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    clearError();

    if (clientError) return;

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      navigate('/');
    } catch {}
  };

  return (
    <div className='mx-auto max-w-md'>
      <div className='rounded-3xl bg-white p-6 shadow-md ring-1 ring-black/5 sm:p-8'>
        {/* Header */}
        <div className='mb-6'>
          <div className='inline-flex items-center gap-2 rounded-2xl bg-green-50 px-3 py-2 text-green-800'>
            <UserPlus className='h-4 w-4' />
            <span className='text-sm font-bold'>REGISTER</span>
          </div>

          <h1 className='mt-4 text-2xl font-extrabold text-gray-900'>
            Create an account 🚀
          </h1>

          <p className='text-sm text-gray-600 mt-1'>
            Join and start learning today.
          </p>
        </div>

        {(error || showClientError) && (
          <div className='mb-4 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
            <div className='flex gap-2'>
              <AlertTriangle className='h-4 w-4 mt-0.5' />
              <span className='font-semibold'>{error || showClientError}</span>
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className='space-y-4'>
          <Input
            icon={<User className='h-4 w-4 text-gray-500' />}
            label='Name'
            value={name}
            onChange={(v) => {
              setName(v);
              clearError();
            }}
            placeholder='User'
          />

          <Input
            icon={<Mail className='h-4 w-4 text-gray-500' />}
            label='Email'
            value={email}
            onChange={(v) => {
              setEmail(v);
              clearError();
            }}
            placeholder='user@mail.com'
          />

          <Input
            icon={<Lock className='h-4 w-4 text-gray-500' />}
            label='Password'
            value={password}
            onChange={(v) => {
              setPassword(v);
              clearError();
            }}
            type='password'
            placeholder='••••••••'
          />

          <Input
            icon={<Lock className='h-4 w-4 text-gray-500' />}
            label='Confirm password'
            value={confirm}
            onChange={(v) => {
              setConfirm(v);
              clearError();
            }}
            type='password'
            placeholder='••••••••'
          />

          <button
            type='submit'
            disabled={loading}
            className='w-full flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-extrabold text-white shadow-sm hover:bg-green-700 disabled:opacity-50'
          >
            {loading ? (
              <>
                <Loader2 className='animate-spin h-4 w-4' />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className='h-4 w-4' />
                Register
              </>
            )}
          </button>
        </form>

        <div className='mt-6 text-center text-sm text-gray-600'>
          Already have an account?{' '}
          <Link
            to='/login'
            className='font-extrabold text-green-700 hover:underline'
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
