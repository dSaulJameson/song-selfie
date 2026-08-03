import { ResetPasswordForm } from "@/src/components/auth/password-recovery-form";

type Props = {
  searchParams: Promise<{ token?: string; error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const query = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#08040d,#16091f)] px-4 py-10">
      <div className="w-full max-w-md">
        <ResetPasswordForm
          token={typeof query.token === "string" ? query.token : undefined}
          invalid={Boolean(query.error)}
        />
      </div>
    </main>
  );
}
