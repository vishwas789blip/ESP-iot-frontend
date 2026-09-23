import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, Mail, Lock, User, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function RegisterPage() {
  const { register } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      show('Account created successfully', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? (err as { message: string }).message : 'Registration failed';
      setError(msg);
      show(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink-900 grid-bg flex items-center justify-center p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent-green/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-11 h-11 rounded-xl bg-accent-cyan/20 border border-accent-cyan/30 flex items-center justify-center">
              <Cpu className="w-6 h-6 text-accent-cyan" />
            </div>
            <span className="font-bold text-white text-lg">ESP32 IoT</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="text-sm text-gray-500 mt-1">Set up your IoT control center</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-accent-red/10 border border-accent-red/30 text-sm text-accent-red animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Name"
              name="name"
              type="text"
              placeholder="John Doe"
              icon={<User className="w-4 h-4" />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              icon={<Lock className="w-4 h-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              label="Confirm Password"
              name="confirm"
              type="password"
              placeholder="Re-enter password"
              icon={<Lock className="w-4 h-4" />}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create account
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent-cyan hover:text-accent-cyan/80 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
