import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/user', {
          credentials: 'include',
        });
        
        if (response.status === 401) {
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${await response.text()}`);
        }
        
        return response.json();
      } catch (error) {
        return null;
      }
    }
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
