import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, MessageSquare, Award } from 'lucide-react';
import { useState } from 'react';

export default function ConnectPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="p-8 space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Connect – Employee Hub</h1>
        <p className="text-muted-foreground">
          Welcome to the Connect suite. Manage your team, schedule shifts, and foster communication.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Team Directory */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(270, 70%, 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'team' ? '0 0 20px rgba(167, 139, 250, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('team')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" style={{ color: 'hsl(270, 70%, 60%)' }} />
              Team Directory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage your brewery team members, roles, and contact information.
            </p>
          </CardContent>
        </Card>

        {/* Schedule Management */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(270, 70%, 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'schedule' ? '0 0 20px rgba(167, 139, 250, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('schedule')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" style={{ color: 'hsl(270, 70%, 60%)' }} />
              Schedule Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage shift schedules, time-off requests, and availability.
            </p>
          </CardContent>
        </Card>

        {/* Team Communication */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(270, 70%, 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'communication' ? '0 0 20px rgba(167, 139, 250, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('communication')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" style={{ color: 'hsl(270, 70%, 60%)' }} />
              Team Communication
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Internal messaging, announcements, and team collaboration tools.
            </p>
          </CardContent>
        </Card>

        {/* Performance & Recognition */}
        <Card 
          className="backdrop-blur-xl transition-all duration-300"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid hsl(270, 70%, 60%)',
            backdropFilter: 'blur(12px)',
            boxShadow: hoveredCard === 'performance' ? '0 0 20px rgba(167, 139, 250, 0.4)' : 'none'
          }}
          onMouseEnter={() => setHoveredCard('performance')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" style={{ color: 'hsl(270, 70%, 60%)' }} />
              Performance & Recognition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Track performance metrics, give recognition, and celebrate team achievements.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
