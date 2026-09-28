import { useState, useEffect, useCallback } from 'react';
import api, { errMsg } from '../utils/api';
import { useSocketEvents } from './useSocket';

export const useCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    try {
      const { data } = await api.get('/courses');
      setCourses(data);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useSocketEvents(['course:created', 'course:updated'], refetch);

  return { courses, loading, error, refetch };
};
