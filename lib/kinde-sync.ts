import {getKindeServerSession} from "@kinde-oss/kinde-auth-nextjs/server";
import db from "@/lib/db";

export async function syncKindeUser() {
  const {getUser} = getKindeServerSession();
  const kindeUser = await getUser();

  if (!kindeUser || !kindeUser.email) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { email: kindeUser.email },
  });

  if (!user) {
    // Create new user if not exists
    return await db.user.create({
      data: {
        email: kindeUser.email,
        name: `${kindeUser.given_name || ""} ${kindeUser.family_name || ""}`.trim() || "Kinde User",
        password: "", // Not used with Kinde
        role: "VIEWER",
      },
    });
  }

  return user;
}
