import { useState, useEffect } from 'react';
import { Plus, Search, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { apiGet, apiPost, ApiError } from '@/lib/api';

interface ComplianceEvent {
  id: string;
  event_type: 'production' | 'transfer' | 'removal' | 'loss_spill' | 'destruction';
  event_date: string;
  reference?: string;
  notes?: string;
  quantity?: number;
  related_batch_id?: string;
  created_at?: string;
}

interface CreateEventPayload {
  event_type: string;
  event_date: string;
  reference?: string;
  notes?: string;
  quantity?: number;
  related_batch_id?: string;
}

const eventTypeColors = {
  production: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  transfer: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  removal: 'bg-green-500/10 text-green-500 border-green-500/20',
  loss_spill: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  destruction: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const eventTypeLabels = {
  production: 'Production',
  transfer: 'Transfer',
  removal: 'Removal',
  loss_spill: 'Loss/Spill',
  destruction: 'Destruction',
};

async function fetchEvents(): Promise<ComplianceEvent[]> {
  try {
    return await apiGet<ComplianceEvent[]>('/api/compliance/events');
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Compliance events endpoint not implemented yet. Please implement GET /api/compliance/events');
    }
    throw error;
  }
}

async function createEvent(payload: CreateEventPayload): Promise<ComplianceEvent> {
  try {
    return await apiPost<ComplianceEvent>('/api/compliance/events', payload);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new Error('Compliance event creation endpoint not implemented yet. Please implement POST /api/compliance/events');
    }
    throw error;
  }
}

export default function Compliance() {
  const [events, setEvents] = useState<ComplianceEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ComplianceEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [eventType, setEventType] = useState<'production' | 'transfer' | 'removal' | 'loss_spill' | 'destruction'>('production');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState<number | undefined>(undefined);
  const [relatedBatchId, setRelatedBatchId] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredEvents(
        events.filter(
          (event) =>
            event.event_type.toLowerCase().includes(query) ||
            event.reference?.toLowerCase().includes(query) ||
            event.notes?.toLowerCase().includes(query) ||
            event.related_batch_id?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, events]);

  async function loadEvents() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchEvents();
      const eventsArray = Array.isArray(data) ? data : [];
      setEvents(eventsArray);
      setFilteredEvents(eventsArray);
    } catch (err) {
      if (err instanceof Error && err.message.includes('not implemented')) {
        setError(err.message);
        setEvents([]);
        setFilteredEvents([]);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch compliance events');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setEventType('production');
    setEventDate(new Date().toISOString().split('T')[0]);
    setReference('');
    setNotes('');
    setQuantity(undefined);
    setRelatedBatchId('');
    setSubmitError(null);
  }

  async function handleCreateEvent() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Validate
      if (!eventDate) {
        throw new Error('Event date is required');
      }

      const payload: CreateEventPayload = {
        event_type: eventType,
        event_date: eventDate,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        quantity: quantity || undefined,
        related_batch_id: relatedBatchId.trim() || undefined,
      };

      const newEvent = await createEvent(payload);
      setEvents([newEvent, ...events]);
      setIsCreateModalOpen(false);
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create compliance event');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Compliance</h1>
          <p className="text-muted-foreground mt-1">TTB/ABC compliance event ledger</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Log Event
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 text-blue-500">
            <FileText className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Compliance Event Tracking</p>
              <p className="text-sm text-muted-foreground">
                Log all production, transfer, removal, loss/spill, and destruction events for TTB and ABC reporting requirements.
                Maintain accurate records for regulatory audits and compliance reporting.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events by type, reference, batch ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-yellow-500">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && filteredEvents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No compliance events logged</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No events match your search.' : 'Start logging compliance events for regulatory tracking.'}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Log Event
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      {!loading && filteredEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Events ({filteredEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={eventTypeColors[event.event_type]}>
                        {eventTypeLabels[event.event_type]}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {new Date(event.event_date).toLocaleDateString()}
                      </span>
                    </div>
                    {event.quantity && (
                      <span className="text-sm font-semibold">{event.quantity} gal</span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {event.reference && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Reference:</span>
                        <span className="font-medium">{event.reference}</span>
                      </div>
                    )}
                    {event.related_batch_id && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Batch ID:</span>
                        <span className="font-medium font-mono text-xs">{event.related_batch_id}</span>
                      </div>
                    )}
                    {event.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes:</span>
                        <p className="mt-1 text-foreground">{event.notes}</p>
                      </div>
                    )}
                  </div>

                  {event.created_at && (
                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Logged: {new Date(event.created_at).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Log Event Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Log Compliance Event</DialogTitle>
            <DialogDescription>
              Record a compliance event for TTB/ABC regulatory tracking and reporting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event_type">Event Type *</Label>
              <Select value={eventType} onValueChange={(value: any) => setEventType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="removal">Removal</SelectItem>
                  <SelectItem value="loss_spill">Loss/Spill</SelectItem>
                  <SelectItem value="destruction">Destruction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="event_date">Event Date *</Label>
              <Input
                id="event_date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>

            {/* Reference */}
            <div className="space-y-2">
              <Label htmlFor="reference">Reference (optional)</Label>
              <Input
                id="reference"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g., TTB-2024-001, Transfer #123"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity (gallons, optional)</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.1"
                value={quantity || ''}
                onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="0.0"
              />
            </div>

            {/* Related Batch ID */}
            <div className="space-y-2">
              <Label htmlFor="related_batch_id">Related Batch ID (optional)</Label>
              <Input
                id="related_batch_id"
                value={relatedBatchId}
                onChange={(e) => setRelatedBatchId(e.target.value)}
                placeholder="e.g., BATCH-2024-001"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add detailed notes about this compliance event..."
                rows={4}
              />
            </div>

            {/* Error Display */}
            {submitError && (
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <p>{submitError}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleCreateEvent} disabled={isSubmitting}>
              {isSubmitting ? 'Logging...' : 'Log Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
