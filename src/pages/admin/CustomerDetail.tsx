import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Baby, PoundSterling, BookOpen, Star, Trash2, Plus, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAdminCustomerDetail } from '@/hooks/useAdminCustomerDetail';
import { useCreateNote, useDeleteNote } from '@/hooks/useAdminNotes';
import { useCreateTask, useToggleTask, useDeleteTask, usePipelineStages, useUpdateStage } from '@/hooks/useAdminTasks';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminCustomerDetail(id);
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const updateStage = useUpdateStage();
  const { data: stages } = usePipelineStages();
  const [noteContent, setNoteContent] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading customer...</div>;
  }

  const { profile, children, purchases, userBooks, assessments, notes, tasks, contact, reviews } = data;
  const totalSpent = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const handleAddNote = async () => {
    if (!noteContent.trim() || !profile?.id) return;
    await createNote.mutateAsync({ profile_id: profile.id, content: noteContent });
    setNoteContent('');
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim() || !profile?.id) return;
    await createTask.mutateAsync({ profile_id: profile.id, title: taskTitle.trim(), due_date: taskDue || undefined });
    setTaskTitle('');
    setTaskDue('');
  };

  const replyByEmail = () => {
    if (!profile?.email) return;
    const greeting = profile.full_name ? `Hi ${profile.full_name.split(' ')[0]},` : 'Hi there,';
    window.location.href = `mailto:${profile.email}?body=${encodeURIComponent(greeting + '\n\n')}`;
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/admin/customers')} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Back to Customers
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{profile.full_name || 'Unnamed'}</h1>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {profile.email}</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {profile.created_at ? format(parseISO(profile.created_at), 'dd/MM/yyyy') : '-'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {profile?.email && (
            <Button variant="outline" size="sm" onClick={replyByEmail} className="gap-1.5">
              <Mail className="h-4 w-4" /> Reply
            </Button>
          )}
          {contact && (
            <select
              value={(contact as any).stage_id ?? ''}
              onChange={(e) => profile?.id && updateStage.mutate({ profile_id: profile.id, stage_id: e.target.value })}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
              title="Pipeline stage"
            >
              {(stages ?? []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <Baby className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Children</p>
              <p className="text-xl font-bold">{children.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <PoundSterling className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-xl font-bold">£{(totalSpent / 100).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <BookOpen className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Books Accessed</p>
              <p className="text-xl font-bold">{userBooks.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="children">
        <TabsList>
          <TabsTrigger value="children">Children</TabsTrigger>
          <TabsTrigger value="purchases">Purchases</TabsTrigger>
          <TabsTrigger value="reading">Reading</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback{reviews.length > 0 ? ` (${reviews.length})` : ''}
          </TabsTrigger>
          <TabsTrigger value="notes">Notes & Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="children">
          <Card>
            <CardContent className="pt-6">
              {children.length === 0 ? (
                <p className="text-muted-foreground">No children registered</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Date of Birth</TableHead>
                      <TableHead>Current Level</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {children.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.date_of_birth ? format(parseISO(c.date_of_birth), 'dd/MM/yyyy') : '-'}</TableCell>
                        <TableCell>
                          {c.current_level ? <Badge>Level {c.current_level}</Badge> : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardContent className="pt-6">
              {purchases.length === 0 ? (
                <p className="text-muted-foreground">No purchases</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {(p as any).products?.name ?? 'Unknown'}
                        </TableCell>
                        <TableCell>£{(p.amount_paid / 100).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'completed' ? 'default' : 'secondary'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {p.completed_at ? format(parseISO(p.completed_at), 'dd/MM/yyyy') : p.created_at ? format(parseISO(p.created_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reading">
          <Card>
            <CardContent className="pt-6">
              {userBooks.length === 0 ? (
                <p className="text-muted-foreground">No books accessed</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userBooks.map(ub => (
                      <TableRow key={ub.id}>
                        <TableCell className="font-medium">
                          {(ub as any).books?.title ?? 'Unknown'}
                        </TableCell>
                        <TableCell>{(ub as any).books?.sub_level ?? '-'}</TableCell>
                        <TableCell><Badge variant="secondary">{ub.source ?? '-'}</Badge></TableCell>
                        <TableCell>
                          {ub.completed_at ? (
                            <Badge variant="default">
                              {format(parseISO(ub.completed_at), 'dd/MM/yyyy')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">In progress</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments">
          <Card>
            <CardContent className="pt-6">
              {assessments.length === 0 ? (
                <p className="text-muted-foreground">No assessments taken</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Recommended Level</TableHead>
                      <TableHead>Sounds</TableHead>
                      <TableHead>Words</TableHead>
                      <TableHead>Tricky Words</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map(a => (
                      <TableRow key={a.id}>
                        <TableCell><Badge>Level {a.recommended_level}</Badge></TableCell>
                        <TableCell>{a.total_sounds_correct}/{a.total_sounds_asked}</TableCell>
                        <TableCell>{a.total_words_correct}/{a.total_words_asked}</TableCell>
                        <TableCell>{a.total_tricky_correct}/{a.total_tricky_asked}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.completed_at ? format(parseISO(a.completed_at), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback">
          <Card>
            <CardContent className="pt-6">
              {reviews.length === 0 ? (
                <p className="text-muted-foreground">No feedback submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star
                              key={n}
                              className={`h-4 w-4 ${r.rating >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">{r.rating ?? '-'}/5</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {r.submitted_at ? format(parseISO(r.submitted_at), 'dd/MM/yyyy') : '-'}
                        </span>
                      </div>
                      {r.feedback && (
                        <p className="text-sm">
                          <span className="font-semibold text-emerald-600">Loved: </span>{r.feedback}
                        </p>
                      )}
                      {r.improvement && (
                        <p className="text-sm">
                          <span className="font-semibold text-amber-600">Could be better: </span>{r.improvement}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {r.consent_marketing && (
                          <Badge variant="default">OK as testimonial</Badge>
                        )}
                        {r.consent_named && (
                          <Badge variant="secondary">OK to name</Badge>
                        )}
                        {r.kind && r.kind !== 'general' && (
                          <Badge variant="outline">{r.kind}</Badge>
                        )}
                        {r.source && <Badge variant="outline">{r.source}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-4">
            {/* Add Note — keyed to profile_id so it works regardless of
                whether the legacy crm_contacts row exists. */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Add Note</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  placeholder="Write a note about this customer..."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  rows={3}
                />
                <Button onClick={handleAddNote} disabled={!noteContent.trim() || createNote.isPending}>
                  {createNote.isPending ? 'Saving...' : 'Add Note'}
                </Button>
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input placeholder="New task…" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="flex-1" />
                  <Input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="sm:w-44" />
                  <Button onClick={handleAddTask} disabled={!taskTitle.trim() || createTask.isPending} className="gap-1.5">
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks yet</p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 rounded-md border p-3">
                        <button onClick={() => toggleTask.mutate({ id: t.id, is_completed: !t.is_completed })} title={t.is_completed ? 'Mark incomplete' : 'Mark complete'}>
                          {t.is_completed ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${t.is_completed ? 'line-through text-muted-foreground' : ''}`}>{t.title}</p>
                          {t.due_date && (
                            <p className="text-xs text-muted-foreground">Due: {format(parseISO(t.due_date), 'dd/MM/yyyy')}</p>
                          )}
                        </div>
                        <button onClick={() => deleteTask.mutate(t.id)} title="Delete task" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <p className="text-muted-foreground">No notes yet</p>
                ) : (
                  <div className="space-y-3">
                    {notes.map(n => (
                      <div key={n.id} className="rounded-md border p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm whitespace-pre-wrap">{n.content}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {n.created_at ? format(parseISO(n.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                          </p>
                        </div>
                        <button onClick={() => deleteNote.mutate(n.id)} title="Delete note" className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
