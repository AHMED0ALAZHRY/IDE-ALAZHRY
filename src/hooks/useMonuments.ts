import { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../firebase';

export const useMonuments = () => {
  const [monuments, setMonuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'monuments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMonuments(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching monuments:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { monuments, loading };
};
