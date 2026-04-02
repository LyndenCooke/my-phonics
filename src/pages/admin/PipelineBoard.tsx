import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAdminPipeline, useMoveContact, useCreateContact, type PipelineContact } from '@/hooks/useAdminPipeline';
import { useAdminCustomers } from '@/hooks/useAdminCustomers';
import { Plus, GripVertical } from 'lucide-react';

export default function PipelineBoard() {
  const { data, isLoading } = useAdminPipeline();
  const moveContact = useMoveContact();
  const createContact = useCreateContact();
  const { data: allCustomers } = useAdminCustomers();
  const [addOpen, setAddOpen] = useState(false);
  const [newProfileId, setNewProfileId] = useState('');
  const [newSource, setNewSource] = useState('');

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading pipeline...</div>;
  }

  const { stages, contacts } = data;

  const contactsByStage = new Map<string, PipelineContact[]>();
  // Also track unassigned contacts (no stage)
  const unassigned: PipelineContact[] = [];
  stages.forEach(s => contactsByStage.set(s.id, []));
  contacts.forEach(c => {
    if (c.stage_id && contactsByStage.has(c.stage_id)) {
      contactsByStage.get(c.stage_id)!.push(c);
    } else {
      unassigned.push(c);
    }
  });

  const handleDragStart = (e: React.DragEvent, contactId: string) => {
    e.dataTransfer.setData('contactId', contactId);
  };

  const handleDrop = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    const contactId = e.dataTransfer.getData('contactId');
    if (contactId) {
      moveContact.mutate({ contactId, stageId });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Existing contact profile IDs to filter out from "add" list
  const existingProfileIds = new Set(contacts.map(c => c.profile_id));
  const availableCustomers = (allCustomers ?? []).filter(c => !existingProfileIds.has(c.id));

  const handleAddContact = async () => {
    if (!newProfileId) return;
    await createContact.mutateAsync({
      profile_id: newProfileId,
      stage_id: stages[0]?.id,
      source: newSource || undefined,
    });
    setNewProfileId('');
    setNewSource('');
    setAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pipeline</h1>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Contact to Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Customer</Label>
                <Select value={newProfileId} onValueChange={setNewProfileId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCustomers.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name || c.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Input
                  placeholder="e.g. organic, referral, ad_campaign"
                  value={newSource}
                  onChange={e => setNewSource(e.target.value)}
                />
              </div>
              <Button onClick={handleAddContact} disabled={!newProfileId || createContact.isPending}>
                {createContact.isPending ? 'Adding...' : 'Add to Pipeline'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stages.map(stage => {
          const stageContacts = contactsByStage.get(stage.id) ?? [];
          return (
            <div
              key={stage.id}
              className="min-w-[280px] flex-shrink-0"
              onDrop={e => handleDrop(e, stage.id)}
              onDragOver={handleDragOver}
            >
              <div className="mb-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.colour ?? '#6366f1' }} />
                <h3 className="text-sm font-semibold">{stage.name}</h3>
                <Badge variant="secondary" className="ml-auto text-xs">{stageContacts.length}</Badge>
              </div>
              <div className="min-h-[200px] space-y-2 rounded-lg bg-muted/40 p-2">
                {stageContacts.map(contact => (
                  <Card
                    key={contact.id}
                    draggable
                    onDragStart={e => handleDragStart(e, contact.id)}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <GripVertical className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {contact.profile?.full_name || contact.profile?.email || 'Unknown'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.profile?.email}
                          </p>
                          {contact.lifetime_value_pence > 0 && (
                            <p className="mt-1 text-xs font-medium text-green-600">
                              £{(contact.lifetime_value_pence / 100).toFixed(2)}
                            </p>
                          )}
                          {contact.source && (
                            <Badge variant="secondary" className="mt-1 text-xs">{contact.source}</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
