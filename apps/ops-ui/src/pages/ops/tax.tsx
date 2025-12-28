import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, Download, FileText } from 'lucide-react';

// Mock data
const taxPeriods = [
  { period: 'November 2024', salesTax: 2840.50, exciseTax: 1250.00, status: 'pending', dueDate: '2024-12-15' },
  { period: 'October 2024', salesTax: 3120.75, exciseTax: 1380.00, status: 'filed', dueDate: '2024-11-15' },
  { period: 'September 2024', salesTax: 2950.25, exciseTax: 1290.00, status: 'paid', dueDate: '2024-10-15' },
];

const taxCategories = [
  { name: 'Sales Tax', amount: 2840.50, rate: '7.5%', description: 'State & local sales tax' },
  { name: 'Federal Excise Tax', amount: 850.00, rate: '$0.07/gal', description: 'TTB excise tax on cider' },
  { name: 'State Excise Tax', amount: 400.00, rate: '$0.03/gal', description: 'State excise tax' },
];

export default function TaxPage() {
  const currentPeriod = taxPeriods[0];
  const totalOwed = currentPeriod.salesTax + currentPeriod.exciseTax;

  return (
    <AppShell pageTitle="Tax Management">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Tax Management</h1>
            <p className="text-muted-foreground mt-1">Track and manage tax obligations</p>
          </div>
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Export Tax Report
          </Button>
        </div>

        {/* Current Period Summary */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Current Period: {currentPeriod.period}</CardTitle>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                {currentPeriod.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Tax Owed</p>
                <p className="text-3xl font-bold text-foreground">${totalOwed.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Due Date</p>
                <div className="flex items-center gap-2 mt-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-xl font-semibold">{currentPeriod.dueDate}</p>
                </div>
              </div>
              <div className="flex items-end">
                <Button className="w-full gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pay Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Breakdown */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
          <CardHeader>
            <CardTitle>Tax Breakdown - {currentPeriod.period}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxCategories.map((category, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg bg-background/30"
                >
                  <div className="flex-1">
                    <p className="font-semibold">{category.name}</p>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Rate: {category.rate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${category.amount.toFixed(2)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t border-border pt-4 flex justify-between items-center">
                <p className="text-lg font-semibold">Total</p>
                <p className="text-3xl font-bold">${totalOwed.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax History */}
        <Card style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid hsl(200, 15%, 65%)',
          backdropFilter: 'blur(12px)',
        }}>
          <CardHeader>
            <CardTitle>Tax Filing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Period</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Sales Tax</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Excise Tax</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Due Date</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxPeriods.map((period, index) => {
                    const total = period.salesTax + period.exciseTax;
                    return (
                      <tr key={index} className="border-b border-border/50 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 font-medium">{period.period}</td>
                        <td className="py-3 px-4">${period.salesTax.toFixed(2)}</td>
                        <td className="py-3 px-4">${period.exciseTax.toFixed(2)}</td>
                        <td className="py-3 px-4 font-semibold">${total.toFixed(2)}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">{period.dueDate}</td>
                        <td className="py-3 px-4">
                          <Badge className={
                            period.status === 'paid' 
                              ? 'bg-green-500/20 text-green-400 border-green-500/50'
                              : period.status === 'filed'
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                              : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                          }>
                            {period.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm" className="gap-1">
                            <FileText className="h-3 w-3" />
                            View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Tax Resources</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  TTB Tax Portal
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  State Tax Portal
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Tax Calculator
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Reports</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Monthly Tax Summary
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Annual Tax Report
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Export for Accountant
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(200, 15%, 65%)',
            backdropFilter: 'blur(12px)',
          }}>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3">Settings</h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Tax Rate Configuration
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Payment Methods
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  Notification Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
