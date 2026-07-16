import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    login?: string;
    uid?: string;
  }
  interface Session {
    user: {
      id: string;
      /** D1 users.id，同步成功后才有 */
      uid?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      login?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    login?: string;
    /** D1 users.id */
    uid?: string;
  }
}
