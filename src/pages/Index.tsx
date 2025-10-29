import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Car, FileText, Download, Zap } from 'lucide-react';
import jecLogo from '@/assets/jec-logo.png';

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      // Don't redirect - show landing page
      return;
    } else if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show authenticated user page
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-0 bg-card/95 backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary-foreground">JEC</span>
              </div>
              <CardTitle className="text-3xl font-bold">
                <div className="text-primary">JECプラットフォーム</div>
                <div className="text-xl text-muted-foreground">JEC Platform</div>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  <div>ようこそ、{user.email}さん</div>
                  <div>Welcome, {user.email}</div>
                </h2>
                <p className="text-muted-foreground">
                  <div>日本車輸出証明書作成システム</div>
                  <div>Japanese Vehicle Export Certificate Generation System</div>
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button 
                  onClick={signOut}
                  variant="outline"
                  className="rounded-lg border-primary/20 hover:bg-primary/5"
                >
                  ログアウト / Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 overflow-hidden">
      {/* Header */}
      <header className="relative z-10 px-6 py-4 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={jecLogo} alt="JEC Logo" className="h-12 w-auto" />
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/login')}
              className="hover:bg-primary/10 transition-all duration-300"
            >
              ログイン / Login
            </Button>
            <Button 
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-primary/90 transition-all duration-300 hover:scale-105"
            >
              始める / Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
              <span className="block text-primary">Export made</span>
              <span className="block">Simple.</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
              日本車輸出証明書の作成を簡単に。AIを活用した自動化により、複雑な手続きを数分で完了。
            </p>
            <p className="text-lg md:text-xl text-muted-foreground/80 mb-12 max-w-3xl mx-auto">
              Simplify Japanese vehicle export certification. Complete complex procedures in minutes with AI-powered automation.
            </p>
          </div>
          
          <div>
            <Button 
              size="lg" 
              onClick={() => navigate('/signup')}
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              無料で始める / Start Free
              <ArrowRight className="ml-3 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      

      {/* Features Section */}
      <section className="px-6 py-20 bg-background/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              なぜJECを選ぶのか / Why Choose JEC
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              輸出手続きを革新的に簡素化する機能
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Car className="h-8 w-8" />,
                title: "車両データ自動抽出",
                subtitle: "Automatic Vehicle Data Extraction",
                description: "画像から車両情報を自動的に読み取り、手動入力の手間を削減"
              },
              {
                icon: <FileText className="h-8 w-8" />,
                title: "証明書自動生成",
                subtitle: "Automatic Certificate Generation", 
                description: "必要な輸出証明書を自動で作成し、フォーマットを統一"
              },
              {
                icon: <Download className="h-8 w-8" />,
                title: "ワンクリックダウンロード",
                subtitle: "One-Click Download",
                description: "完成した証明書をすぐにダウンロード可能"
              }
            ].map((feature, index) => (
              <Card 
                key={index} 
                className="p-6 border-0 bg-card/80 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in"
                style={{animationDelay: `${1 + index * 0.2}s`}}
              >
                <CardContent className="text-center space-y-4 p-0">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{feature.subtitle}</p>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-12 border-0 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm animate-fade-in">
            <CardContent className="space-y-6 p-0">
              <Zap className="mx-auto h-16 w-16 text-primary animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                今すぐ始めましょう / Get Started Today
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                アカウント作成は無料。今すぐJECプラットフォームで輸出手続きを簡素化しましょう。
              </p>
              <div className="pt-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate('/signup')}
                  className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  無料アカウント作成 / Create Free Account
                  <ArrowRight className="ml-3 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 bg-background/80 backdrop-blur-sm border-t border-border/50">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          <div className="space-x-4">
            <a href="/privacy" className="underline hover:text-foreground">プライバシー / Privacy</a>
            <span>•</span>
            <a href="/terms" className="underline hover:text-foreground">利用規約 / Terms</a>
          </div>
          <p className="mt-2">&copy; 2024 JEC Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
