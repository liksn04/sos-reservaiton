import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useReservations } from '../hooks/useReservations';
import DashboardView from '../components/DashboardView';

export default function HomeRoute() {
  const { data: reservations = [] } = useReservations();
  const [totalUserCount, setTotalUserCount] = useState(0);

  useEffect(() => {
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setTotalUserCount(count ?? 0));
  }, []);

  return (
    <DashboardView
      reservations={reservations}
      totalUserCount={totalUserCount}
    />
  );
}
