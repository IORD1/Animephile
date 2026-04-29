import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function FollowingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/profile');
  }, [router]);
  return null;
}
