import { useEffect, useState } from 'react';
import { useReservations } from '../hooks/useReservations';
import { getTotalUserCount } from '../services/adminService';
import DashboardView from '../components/DashboardView';

export default function HomeRoute() {
  const { data: reservations = [] } = useReservations();
  const [totalUserCount, setTotalUserCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    getTotalUserCount()
      .then((count) => {
        if (isMounted) setTotalUserCount(count);
      })
      .catch(() => {
        if (isMounted) setTotalUserCount(0);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardView
      reservations={reservations}
      totalUserCount={totalUserCount}
    />
  );
}
