import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, Baby, PoundSterling, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useAdminCustomerDetail } from '@/hooks/useAdminCustomerDetail';
import { useCreateNote } from '@/hooks/useAdminNotes';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminCustomerDetail(id);
  const createNote = useCreateNote();
  const [noteContent, setNoteContent] = useState('');

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading customer...</div>;
  }

  const { profile, children, purchases, userBooks, assessments, notes, tasks, contact } = data;
  const totalSpent = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount_paid, 0);

  const handleAddNote = async () => {
    if (!noteContent.trim() || !contact?.id) return;
    await createNote.mutateAsync({ contact_id: contact.id, content: noteContent });
    setNoteContent('');
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
        {contact && (
          <Badge
            style={{
              backgroundColor:
                (contact as { crm_pipeline_stages?: { colour?: string; name?: string } })
                  .crm_pipeline_stages?.colour ?? '#6366f1',
            }}
            className="text-white"
          >
            {(contact as { crm_pipeline_stages?: { name?: string } })
              .crm_pipeline_stages?.name ?? 'Unknown Stage'}
          </Badge>
        )}
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
                          {(p as { products?: { name?: string } }).products?.name ?? 'Unknown'}
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
                          {(ub as { books?: { title?: string; sub_level?: string } }).books?.title ?? 'Unknown'}
                        </TableCell>
                        <TableCell>{(ub as { books?: { sub_level?: string } }).books?.sub_level ?? '-'}</TableCell>
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

        <TabsContent value="notes">
          <div className="space-y-4">
            {/* Add Note */}
            {contact && (
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
            )}

            {/* Tasks */}
            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tasks.map(t => (
                      <div key={t.id} className="flex items-center gap-3 rounded-md border p-3">
                        <div className={`h-2 w-2 rounded-full ${t.is_completed ? 'bg-green-500' : 'bg-amber-500'}`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{t.title}</p>
                          {t.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due: {format(parseISO(t.due_date), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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
                      <div key={n.id} className="rounded-md border p-3">
                        <p className="text-sm">{n.content}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {n.created_at ? format(parseISO(n.created_at), 'dd/MM/yyyy HH:mm') : '-'}
                        </p>
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
