import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { schoolDb } from '../lib/schoolClient';

export type SchoolMembership = {
  id: string;
  school_id: string;
  role: 'admin' | 'teacher';
  school: {
    id: string;
    name: string;
    country: string | null;
    seat_count: number;
    subscription_tier: string;
    join_code: string | null;
    academic_year: string | null;
  };
};

export function useSchoolMemberships() {
  const { user, loading: authLoading } = useAuth();
  const [memberships, setMemberships] = useState<SchoolMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await schoolDb
      .memberships()
      .select('id, school_id, role, school:schools(id, name, country, seat_count, subscription_tier, join_code, academic_year)')
      .eq('user_id', user.id);
    if (error) {
      console.warn('useSchoolMemberships:', (error as { message?: string }).message);
      setMemberships([]);
    } else {
      setMemberships((data ?? []) as unknown as SchoolMembership[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, refresh]);

  return { memberships, loading: loading || authLoading, refresh };
}
