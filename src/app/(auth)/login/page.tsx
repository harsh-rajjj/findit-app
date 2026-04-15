import { Suspense } from "react";
import { LoginClient } from "./LoginClient";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const raw = sp.callbackUrl;
  const callbackUrl = Array.isArray(raw) ? raw[0] : raw;

  return (
    <Suspense fallback={<div className="min-h-[80vh]" />}>
      <LoginClient callbackUrl={callbackUrl} />
    </Suspense>
  );
}
