import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddYeastForm from '@/components/forms/AddYeastForm';
import AddMaltForm from '@/components/forms/AddMaltForm';
import AddHopsForm from '@/components/forms/AddHopsForm';
import AddFruitForm from '@/components/forms/AddFruitForm';
import AddGenericItemForm from '@/components/forms/AddGenericItemForm';

export default function AddInventoryItemPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category') || 'equipment';

  const categoryConfig: Record<string, { label: string; isIngredient: boolean }> = {
    yeast: { label: 'Yeast', isIngredient: true },
    malt: { label: 'Malt & Grains', isIngredient: true },
    hops: { label: 'Hops', isIngredient: true },
    fruit: { label: 'Fruit & Adjuncts', isIngredient: true },
    equipment: { label: 'Equipment', isIngredient: false },
    packaging: { label: 'Packaging', isIngredient: false },
    kegs: { label: 'Kegs & Barrels', isIngredient: false },
  };

  const config = categoryConfig[category] || categoryConfig.equipment;

  const handleSubmit = async (data: any) => {
    console.log('Submitting item:', { category, ...data });
    
    // TODO: Call API to save item
    // const response = await fetch('/api/os/items', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ category, ...data }),
    // });
    
    // For now, just show success and navigate back
    alert(`${config.label} added successfully!`);
    navigate('/');
  };

  const handleCancel = () => {
    navigate('/');
  };

  const renderForm = () => {
    switch (category) {
      case 'yeast':
        return <AddYeastForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'malt':
        return <AddMaltForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'hops':
        return <AddHopsForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      case 'fruit':
        return <AddFruitForm onSubmit={handleSubmit} onCancel={handleCancel} />;
      
      default:
        return (
          <AddGenericItemForm
            category={category}
            categoryLabel={config.label}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        );
    }
  };

  return (
    <AppShell currentSuite="os" pageTitle={`Add ${config.label}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Add {config.label}
            </h1>
            <p className="text-muted-foreground">
              {config.isIngredient
                ? 'LAB-tracked ingredient - detailed specifications required'
                : 'Non-ingredient inventory item'}
            </p>
          </div>
        </div>

        {/* Form Content */}
        {renderForm()}
      </div>
    </AppShell>
  );
}
