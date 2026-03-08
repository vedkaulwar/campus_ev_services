import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/firebase-admin"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing required fields")
        }

        // Find user in Firestore by email
        const usersRef = db.collection("users")
        const snapshot = await usersRef.where("email", "==", credentials.email).limit(1).get()

        if (snapshot.empty) {
          throw new Error("User not found")
        }

        const userDoc = snapshot.docs[0]
        const user = userDoc.data()

        if (!user.password) {
          throw new Error("User not found")
        }

        const passwordMatch = await bcrypt.compare(credentials.password, user.password)

        if (!passwordMatch) {
          throw new Error("Invalid password")
        }

        return {
          id: userDoc.id,
          email: user.email,
          name: user.name,
          collegeId: user.collegeId,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        // @ts-ignore
        token.collegeId = user.collegeId
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        // @ts-ignore
        session.user.id = token.id
        // @ts-ignore
        session.user.collegeId = token.collegeId
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-dev",
}
