import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      reset: Email({
        sendVerificationRequest: async ({ identifier, url, token }) => {
          console.log(
            `[Password Reset] Email for ${identifier}: code ${token}, link ${url}`,
          );
        },
      }),
    }),
  ],
});
