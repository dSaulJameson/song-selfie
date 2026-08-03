import { ForgotPasswordForm } from "@/src/components/auth/password-recovery-form";

type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const query = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08040d,#16091f)] px-4 py-10">
      <div className="w-full max-w-md">
        <ForgotPasswordForm
          initialEmail={typeof query.email === "string" ? query.email : ""}
        />
      </div>
    </main>
  );
}
