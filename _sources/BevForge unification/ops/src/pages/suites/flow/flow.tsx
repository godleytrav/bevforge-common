import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplet, BarChart3, Package, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export default function FlowPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Flow – Taps & Kegs</h1>
        <p className="text-muted-foreground">
          Welcome to the Flow suite. Monitor your draft systems, manage kegs, and track beverage flow.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tap Management */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(45, 95%, 55%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'taps' ? '0 0 20px rgba(255, 193, 7, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('taps')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplet className="h-5 w-5" style={{ color: 'hsl(180, 95%, 55%)' }} />
              Tap Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Monitor all tap lines, flow rates, and beverage levels in real-time.
            </p>
          </CardContent>
        </Card>

        {/* Keg Inventory */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(45, 95%, 55%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'kegs' ? '0 0 20px rgba(255, 193, 7, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('kegs')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" style={{ color: 'hsl(180, 95%, 55%)' }} />
              Keg Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track keg stock levels, locations, and rotation schedules.
            </p>
          </CardContent>
        </Card>

        {/* Flow Analytics */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(45, 95%, 55%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'analytics' ? '0 0 20px rgba(255, 193, 7, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('analytics')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" style={{ color: 'hsl(180, 95%, 55%)' }} />
              Flow Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Analyze pour patterns, consumption trends, and optimize inventory.
            </p>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(45, 95%, 55%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'metrics' ? '0 0 20px rgba(255, 193, 7, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('metrics')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" style={{ color: 'hsl(180, 95%, 55%)' }} />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track system efficiency, waste reduction, and revenue per tap.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
