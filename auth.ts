import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logger } from "@/lib/logger";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Don't use adapter with Credentials provider - it's incompatible
  session: {
    strategy: "jwt", // Use JWT sessions for Credentials provider
  },
  useSecureCookies: process.env.NODE_ENV === "production", // Use secure cookies in production
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) {
          logger.warn("Missing credentials in login attempt");
          throw new Error("Missing credentials");
        }

        try {
          const email = credentials.email as string;
          const password = credentials.password as string;

          logger.debug("Attempting to find user", { email });

          const user = await prisma.user.findUnique({
            where: { email },
            include: { employee: true },
          }).catch((err: unknown) => {
            logger.error("Database error finding user", err, { email });
            throw new Error("Database connection failed. Please try again.");
          });

          logger.debug("User lookup result", { found: !!user, email });

          if (!user || !user.isActive) {
            logger.warn("Invalid login attempt - user not found or inactive", { email });
            throw new Error("Invalid credentials");
          }

          // Check if email is verified
          if (!user.emailVerified) {
            logger.warn("Login attempt with unverified email", { email });
            throw new Error("Please verify your email address before logging in. Check your inbox for the verification code.");
          }

          const isPasswordValid = await bcrypt.compare(password, user.password);
          logger.debug("Password validation", { valid: isPasswordValid, email });

          if (!isPasswordValid) {
            logger.warn("Invalid password attempt", { email });
            throw new Error("Invalid credentials");
          }

          logger.info("Authentication successful", { email, role: user.role });

          return {
            id: user.id,
            email: user.email,
            name: user.employee?.fullName || user.email,
            role: user.role,
            employeeId: user.employee?.id,
            profileCompleted: user.employee?.profileCompleted ?? false,
          };
        } catch (error) {
          logger.error("Auth error", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign-in
      if (account?.provider === "google") {
        try {
          const email = user.email!;

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email },
            include: { employee: true },
          });

          if (!existingUser) {
            // Create new user with Google OAuth
            logger.info("Creating new user via Google OAuth", { email });

            const employeeCount = await prisma.employee.count();
            const employeeCode = `EMP${String(employeeCount + 1).padStart(4, "0")}`;

            existingUser = await prisma.user.create({
              data: {
                email,
                password: "", // No password for OAuth users
                role: "EMPLOYEE",
                isActive: true,
                emailVerified: true, // Google OAuth emails are pre-verified
                employee: {
                  create: {
                    employeeCode,
                    fullName: user.name || email,
                    designation: "Employee",
                    department: "General",
                    joiningDate: new Date(),
                  },
                },
              },
              include: { employee: true },
            });

            logger.info("User created via Google OAuth", { email, employeeCode });
          } else {
            logger.info("Existing user logged in via Google OAuth", { email });
          }

          // Attach user data to the user object for JWT callback
          (user as any).id = existingUser.id;
          (user as any).role = existingUser.role;
          (user as any).employeeId = existingUser.employee?.id;
          (user as any).profileCompleted = existingUser.employee?.profileCompleted ?? false;

          return true;
        } catch (error) {
          logger.error("Error in Google OAuth sign-in", error, { email: user.email });
          return false;
        }
      }

      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.employeeId = (user as any).employeeId;
        token.profileCompleted = (user as any).profileCompleted;
      }

      // Allow updating session manually from client
      if (trigger === "update" && session) {
        if (session.profileCompleted !== undefined) {
          token.profileCompleted = session.profileCompleted;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).employeeId = token.employeeId;
        (session.user as any).profileCompleted = token.profileCompleted;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.AUTH_SECRET,
  trustHost: true, // Required for production deployment on Vercel
});
