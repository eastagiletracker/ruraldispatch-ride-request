import { AlertCircle, Lock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const APP_PASSWORD = 'hackct25';

export default function PasswordProtection() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === APP_PASSWORD) {
      // Store in localStorage and sessionStorage with 24-hour expiration
      const expirationTime = new Date().getTime() + 24 * 60 * 60 * 1000; // 24 hours from now
      const authData = JSON.stringify({
        authenticated: true,
        expiresAt: expirationTime,
      });

      localStorage.setItem('app_authenticated', authData);
      sessionStorage.setItem('app_authenticated', authData);
      navigate('/'); // Go directly to ride request form
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Rural Dispatch Portal</CardTitle>
          <CardDescription>Enter the access password to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoFocus
              />
            </div>

            <Button type="submit" className="w-full">
              Access Portal
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
