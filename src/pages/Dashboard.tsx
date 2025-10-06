import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Building2, ArrowRight } from 'lucide-react';
import { CreateCompanyModal } from '@/components/CreateCompanyModal';
import { useToast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name_english: string;
  name_kanji: string;
  name_katakana: string;
  address_japanese: string;
  phone: string;
  phone_type: string;
  juso_code: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchCompanies();
    }
  }, [user]);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      
      // First get the user profile
      const { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!userProfile) {
        console.log('No user profile found');
        setIsLoading(false);
        return;
      }

      // Then get companies through user_companies relationship
      const { data: userCompanies, error } = await supabase
        .from('user_companies')
        .select(`
          company_id,
          companies!inner (
            id,
            name_english,
            name_kanji,
            name_katakana,
            address_japanese,
            phone,
            phone_type,
            juso_code,
            created_at
          )
        `)
        .eq('user_id', userProfile.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching companies:', error);
        toast({
          variant: "destructive",
          title: "エラー / Error",
          description: "会社データの取得に失敗しました / Failed to fetch companies",
        });
      } else {
        const companiesData = userCompanies?.map(uc => uc.companies).filter(Boolean) || [];
        setCompanies(companiesData as Company[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyCreated = () => {
    fetchCompanies();
    setShowCreateModal(false);
    toast({
      title: "会社作成完了 / Company Created",
      description: "新しい会社が正常に作成されました / New company has been created successfully",
    });
  };

  const handleCompanyClick = (companyId: string) => {
    navigate(`/export/${companyId}`);
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-primary-foreground">JEC</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                ダッシュボード / Dashboard
              </h1>
              <p className="text-muted-foreground">
                ようこそ、{user.email}さん / Welcome, {user.email}
              </p>
            </div>
          </div>
          <Button 
            onClick={signOut}
            variant="outline"
            className="rounded-lg border-primary/20 hover:bg-primary/5"
          >
            ログアウト / Logout
          </Button>
        </div>

        {/* Create Company Button */}
        <div className="mb-6">
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-lg bg-primary hover:bg-secondary transition-all duration-200 transform hover:scale-[1.02]"
          >
            <Plus className="w-5 h-5 mr-2" />
            会社を作成 / Create Company
          </Button>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-full">
              <Card className="shadow-lg border-0 bg-card/95 backdrop-blur-sm text-center py-12">
                <CardContent>
                  <Building2 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    会社がありません / No Companies
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    最初の会社を作成して開始しましょう / Create your first company to get started
                  </p>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="rounded-lg bg-primary hover:bg-secondary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    会社を作成 / Create Company
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            companies.map((company) => (
              <Card 
                key={company.id} 
                className="shadow-lg border-0 bg-card/95 backdrop-blur-sm hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <span className="text-lg font-bold text-foreground truncate">
                        {company.name_english}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">漢字名 / Kanji Name</p>
                    <p className="font-medium text-foreground">{company.name_kanji}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">カタカナ名 / Katakana Name</p>
                    <p className="font-medium text-foreground">{company.name_katakana}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">住所 / Address</p>
                    <p className="text-sm text-foreground line-clamp-2">{company.address_japanese}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>{company.phone}</span>
                    <span>{new Date(company.created_at).toLocaleDateString()}</span>
                  </div>
                  <Button
                    onClick={() => handleCompanyClick(company.id)}
                    className="w-full rounded-lg bg-primary hover:bg-secondary transition-all duration-200"
                  >
                    <span>輸出管理 / Export Management</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Create Company Modal */}
        <CreateCompanyModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onCompanyCreated={handleCompanyCreated}
        />
      </div>
    </div>
  );
};

export default Dashboard;