import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">AT-Care</h1>
          <p className="mt-2 text-gray-600">보조공학 사례관리 시스템</p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-xl",
            },
          }}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          afterSignInUrl="/dashboard"
        />
      </div>
    </div>
  );
}

