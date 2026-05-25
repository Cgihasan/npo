import { syncKindeUser } from "./kinde-sync";

/**
 * Compatibility layer to replace NextAuth's auth() with Kinde
 * This allows us to minimize changes in other files.
 */
export async function auth() {
  const user = await syncKindeUser();
  if (!user) return null;

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

// Mock other exports if needed to prevent import errors,
// though they should be removed from usages eventually.
export const signIn = () => { throw new Error("Use Kinde LoginLink instead"); };
export const signOut = () => { throw new Error("Use Kinde LogoutLink instead"); };
export const handlers = {};
