import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function CreatePlaceholder() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/create-post');
  }, []);

  return null;
}
