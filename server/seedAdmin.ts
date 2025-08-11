import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function createAdminUser() {
  try {
    // Check if admin user already exists
    const [existingAdmin] = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@creatorhub.test"));

    if (existingAdmin) {
      console.log("Admin user already exists");
      return existingAdmin;
    }

    // Create admin user
    const [adminUser] = await db
      .insert(users)
      .values({
        id: "admin-test-user",
        email: "admin@creatorhub.test",
        firstName: "Admin",
        lastName: "User",
        isAdmin: true,
        profileImageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      })
      .returning();

    console.log("✅ Created admin user:", adminUser.email);
    return adminUser;
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}