import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import VehicleUploadInterface from '@/components/VehicleUploadInterface';

const ExportDashboard = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            size="sm"
            className="rounded-lg border-primary/20 hover:bg-primary/5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る / Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              輸出管理 / Export Management
            </h1>
            <p className="text-muted-foreground">
              車両輸出証明書の作成と管理 / Vehicle Export Certificate Creation and Management
            </p>
          </div>
        </div>

        {/* Vehicle Upload Interface */}
        <VehicleUploadInterface companyId={companyId || ''} />
      </div>
    </div>
  );
};

export default ExportDashboard;