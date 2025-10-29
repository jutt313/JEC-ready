import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptLegal, setAcceptLegal] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">JEC</span>
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              ログイン / Login
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              JECプラットフォームにアクセス / Access the JEC Platform
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  <span className="text-foreground">メールアドレス / Email Address</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg border-border/50 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <span className="text-foreground">パスワード / Password</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg border-border/50 focus:border-primary focus:ring-primary/20"
                />
              </div>

              <div className="text-right">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-secondary transition-colors"
                >
                  パスワードを忘れた場合 / Forgot Password?
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <div className="flex items-start space-x-3 text-left">
                <Checkbox id="accept-legal-login" checked={acceptLegal} onCheckedChange={(v) => setAcceptLegal(!!v)} />
                <Label htmlFor="accept-legal-login" className="text-sm text-muted-foreground cursor-pointer">
                  <span className="block text-foreground">利用規約とプライバシーに同意します</span>
                  <span>I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</span>
                </Label>
              </div>
              <Button 
                type="submit" 
                className="w-full rounded-lg bg-primary hover:bg-secondary transition-all duration-200 transform hover:scale-[1.02]"
                disabled={loading || !acceptLegal}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>ログイン中... / Signing in...</span>
                  </div>
                ) : (
                  <span>ログイン / Login</span>
                )}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <span>アカウントをお持ちでないですか？ / Don't have an account? </span>
                <Link 
                  to="/signup" 
                  className="text-primary hover:text-secondary font-medium transition-colors"
                >
                  登録 / Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
