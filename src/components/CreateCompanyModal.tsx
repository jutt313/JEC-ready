import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface CreateCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompanyCreated: () => void;
}

interface ValidationErrors {
  [key: string]: string;
}

export const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  open,
  onOpenChange,
  onCompanyCreated,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    nameEnglish: '',
    nameKanji: '',
    nameKatakana: '',
    addressJapanese: '',
    phoneType: 'company' as 'company' | 'personal',
    phone: '',
    jusoCode: '',
  });

  // Validation functions - All restrictions removed
  const validateKatakana = (text: string): boolean => {
    return true; // No restrictions
  };

  const validateKanjiHiragana = (text: string): boolean => {
    return true; // No restrictions
  };

  const validateJusoCode = (jusoCode: string): boolean => {
    return true; // No restrictions
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Real-time validation - All character restrictions removed
    // No validation errors for character types
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.nameEnglish.trim()) {
      newErrors.nameEnglish = '英語の会社名は必須です / English company name is required';
    }

    if (!formData.nameKanji.trim()) {
      newErrors.nameKanji = '漢字の会社名は必須です / Kanji company name is required';
    }

    if (!formData.nameKatakana.trim()) {
      newErrors.nameKatakana = 'カタカナの会社名は必須です / Katakana company name is required';
    }

    if (!formData.addressJapanese.trim()) {
      newErrors.addressJapanese = '会社住所は必須です / Company address is required';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '電話番号は必須です / Phone number is required';
    }

    if (!formData.jusoCode.trim()) {
      newErrors.jusoCode = '住所コードは必須です / JUSO code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !validateForm()) return;

    setLoading(true);

    try {
      // First, ensure user profile exists
      let { data: userProfile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!userProfile) {
        // Create user profile
        const { data: newUserProfile, error: userError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            role: 'user',
          })
          .select('id')
          .single();

        if (userError) {
          console.error('Error creating user profile:', userError);
          throw userError;
        }
        userProfile = newUserProfile;
      }

      // Create company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
          name_english: formData.nameEnglish,
          name_kanji: formData.nameKanji,
          name_katakana: formData.nameKatakana,
          address_japanese: formData.addressJapanese,
          phone: formData.phone,
          phone_type: formData.phoneType,
          juso_code: formData.jusoCode,
          created_by: userProfile.id,
        })
        .select('id')
        .single();

      if (companyError) {
        console.error('Error creating company:', companyError);
        throw companyError;
      }

      // Create user-company relationship
      const { error: relationError } = await supabase
        .from('user_companies')
        .insert({
          user_id: userProfile.id,
          company_id: company.id,
          role: 'owner',
        });

      if (relationError) {
        console.error('Error creating user-company relation:', relationError);
        throw relationError;
      }

      // Reset form
      setFormData({
        nameEnglish: '',
        nameKanji: '',
        nameKatakana: '',
        addressJapanese: '',
        phoneType: 'company',
        phone: '',
        jusoCode: '',
      });
      setErrors({});

      onCompanyCreated();
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast({
        variant: "destructive",
        title: "エラー / Error",
        description: error.message || "会社の作成に失敗しました / Failed to create company",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold text-primary">
            会社を作成 / Create Company
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            新しい会社の情報を入力してください / Please enter the new company's information
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-6">
          <form onSubmit={handleSubmit} className="space-y-6 pb-6">
            {/* Company Name English */}
            <div className="space-y-2">
              <Label htmlFor="nameEnglish">
                <span className="text-foreground">会社名（英語）/ Company Name (English) *</span>
              </Label>
              <Input
                id="nameEnglish"
                type="text"
                placeholder="Tokyo Auto Export Ltd."
                value={formData.nameEnglish}
                onChange={(e) => handleInputChange('nameEnglish', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.nameEnglish && (
                <p className="text-sm text-destructive">{errors.nameEnglish}</p>
              )}
            </div>

            {/* Company Name Kanji */}
            <div className="space-y-2">
              <Label htmlFor="nameKanji">
                <span className="text-foreground">会社名（漢字・ひらがな）/ Company Name (Kanji/Hiragana) *</span>
              </Label>
              <Input
                id="nameKanji"
                type="text"
                placeholder="東京自動車輸出株式会社"
                value={formData.nameKanji}
                onChange={(e) => handleInputChange('nameKanji', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.nameKanji && (
                <p className="text-sm text-destructive">{errors.nameKanji}</p>
              )}
            </div>

            {/* Company Name Katakana */}
            <div className="space-y-2">
              <Label htmlFor="nameKatakana">
                <span className="text-foreground">会社名（カタカナ）/ Company Name (Katakana) *</span>
              </Label>
              <Input
                id="nameKatakana"
                type="text"
                placeholder="トウキョウジドウシャユシュツカブシキガイシャ"
                value={formData.nameKatakana}
                onChange={(e) => handleInputChange('nameKatakana', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.nameKatakana && (
                <p className="text-sm text-destructive">{errors.nameKatakana}</p>
              )}
            </div>

            {/* Company Address */}
            <div className="space-y-2">
              <Label htmlFor="addressJapanese">
                <span className="text-foreground">会社住所（漢字・ひらがな）/ Company Address (Kanji/Hiragana) *</span>
              </Label>
              <Input
                id="addressJapanese"
                type="text"
                placeholder="東京都渋谷区恵比寿一丁目二番三号"
                value={formData.addressJapanese}
                onChange={(e) => handleInputChange('addressJapanese', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.addressJapanese && (
                <p className="text-sm text-destructive">{errors.addressJapanese}</p>
              )}
            </div>

            {/* JUSO Code */}
            <div className="space-y-2">
              <Label htmlFor="jusoCode">
                <span className="text-foreground">住所コード / JUSO Code *</span>
              </Label>
              <Input
                id="jusoCode"
                type="text"
                placeholder="15001"
                value={formData.jusoCode}
                onChange={(e) => handleInputChange('jusoCode', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.jusoCode && (
                <p className="text-sm text-destructive">{errors.jusoCode}</p>
              )}
            </div>

            {/* Phone Number Type */}
            <div className="space-y-3">
              <Label className="text-foreground">
                電話番号の種類 / Phone Number Type *
              </Label>
              <RadioGroup
                value={formData.phoneType}
                onValueChange={(value) => handleInputChange('phoneType', value as 'company' | 'personal')}
                className="flex space-x-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="company" id="company-phone" />
                  <Label htmlFor="company-phone" className="text-sm">
                    会社電話番号 / Company Phone
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="personal" id="personal-phone" />
                  <Label htmlFor="personal-phone" className="text-sm">
                    個人電話番号 / Personal Phone
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label htmlFor="phone">
                <span className="text-foreground">電話番号 / Phone Number *</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+81-3-1234-5678"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
                className="rounded-lg"
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 rounded-lg"
                disabled={loading}
              >
                キャンセル / Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 rounded-lg bg-primary hover:bg-secondary transition-all duration-200"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin"></div>
                    <span>作成中... / Creating...</span>
                  </div>
                ) : (
                  <span>会社を作成 / Create Company</span>
                )}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};