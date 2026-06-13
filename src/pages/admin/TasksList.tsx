import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminTasks, useCreateTask, useToggleTask } from '@/hooks/useAdminTasks';
import { useAdminPipeline } from '@/hooks/useAdminPipeline';
import { Plus } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

export default function TasksList() {
  const [filter, setFilter] = useState<'all' | 'overdue' | 'mine' | 'completed'>('all');
  const { data: tasks, isLoading } = useAdminTasks(filter);
  const { data: pipeline } = useAdminPipeline();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', contact_id: '', due_date: '' });

  const contacts = pipeline?.contacts ?? [];

  const handleCreate = async () => {
    if (!newTask.title) return;
    await createTask.mutateAsync({
      title: newTask.title,
      description: newTask.description || undefined,
      contact_id: newTask.contact_id || undefined,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : undefined,
    });
    setNewTask({ title: '', description: '', contact_id: '', due_date: '' });
    setCreateOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Tasks</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input value={newTask.title} onChange={e => setNewTask(t => ({ ...t, title: e.target.value }))} placeholder="e.g. Follow up on assessment" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={newTask.description} onChange={e => setNewTask(t => ({ ...t, description: e.target.value }))} rows={3} />
              </div>
              <div>
                <Label>Contact (optional)</Label>
                <Select value={newTask.contact_id} onValueChange={v => setNewTask(t => ({ ...t, contact_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select contact..." /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.profile?.full_name || c.profile?.email || c.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={newTask.due_date} onChange={e => setNewTask(t => ({ ...t, due_date: e.target.value }))} />
              </div>
              <Button onClick={handleCreate} disabled={!newTask.title || createTask.isPending}>
                {createTask.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All Open</TabsTrigger>
          <TabsTrigger value="overdue">Overdue</TabsTrigger>
          <TabsTrigger value="mine">My Tasks</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="text-muted-foreground">Loading tasks...</div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Title</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(tasks ?? []).map(t => {
                  const isOverdue = t.due_date && !t.is_completed && isPast(parseISO(t.due_date));
                  return (
                    <TableRow key={t.id}>
                      <TableCell>
                        <Checkbox
                          checked={t.is_completed}
                          onCheckedChange={(checked) => {
                            toggleTask.mutate({ id: t.id, is_completed: checked === true });
                          }}
                        />
                      </TableCell>
                      <TableCell className={t.is_completed ? 'line-through text-muted-foreground' : 'font-medium'}>
                        {t.title}
                        {t.description && (
                          <p className="text-xs text-muted-foreground">{t.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {t.contact?.profiles?.full_name || t.contact?.profiles?.email || '-'}
                      </TableCell>
                      <TableCell className={isOverdue ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                        {t.due_date ? format(parseISO(t.due_date), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        {t.is_completed ? (
                          <Badge variant="default">Done</Badge>
                        ) : isOverdue ? (
                          <Badge variant="destructive">Overdue</Badge>
                        ) : (
                          <Badge variant="secondary">Open</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {(tasks ?? []).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No tasks found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
