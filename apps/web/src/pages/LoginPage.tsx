import { zodResolver } from "@hookform/resolvers/zod";
import { ShieldCheck, Waypoints } from "lucide-react";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";

import { loginSchema, type LoginInput } from "@whoischecker/shared";

import { Button, Card, FormLabel, Input } from "@/components";
import { useLoginMutation } from "@/hooks/use-platform-data";
import { useAppShellStore } from "@/store/app-shell-store";

export function LoginPage() {
  const navigate = useNavigate();
  const sessionUser = useAppShellStore((state) => state.sessionUser);
  const sessionResolved = useAppShellStore((state) => state.sessionResolved);
  const loginMutation = useLoginMutation();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "eva@monitoring.internal",
      password: "ChangeMe!123",
    },
  });

  if (!sessionResolved) {
    return <div className="grid min-h-screen place-items-center text-sm text-slate-500">Sessie wordt geladen...</div>;
  }

  if (sessionUser) {
    return <Navigate replace to="/dashboard" />;
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-surface section-grid hidden min-h-[720px] overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col">
          <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white/90">
            <Waypoints className="h-4 w-4" />
            Veilig domeinmonitoringplatform
          </div>
          <div className="mt-14 max-w-xl">
            <h1 className="text-5xl font-semibold tracking-[-0.05em]">
              Monitor, alarmeer en registreer kritieke merkdomeinen automatisch zonder operationeel risico te lekken.
            </h1>
            <p className="mt-6 text-base leading-7 text-white/72">
              Productiegerichte UI-shell met typed workflows voor WHOIS-checks, ntfy-notificaties, Openprovider-
              integratie en auditbaarheid.
            </p>
          </div>
          <div className="mt-auto grid gap-4">
            {[
              "RBAC en server-side autorisatiecontroles",
              "Versleutelde providercredentials en veilige notificatierelay",
              "Queue-gedragen checks, retries en idempotente registratieflows",
            ].map((item) => (
              <div key={item} className="rounded-3xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/88">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card
          className="mx-auto w-full max-w-xl"
          subtitle="Gebruik de meegeleverde demo-credentials om de eerste oplevering te bekijken."
          title="Aanmelden"
        >
          <form
            className="space-y-5"
            onSubmit={form.handleSubmit(async (values) => {
              await loginMutation.mutateAsync(values);
              navigate("/dashboard");
            })}
          >
            <div className="rounded-3xl border border-primary-100 bg-primary-50/80 p-4 text-sm text-primary-700">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5" />
                <div>
                  <p className="font-semibold">Demo-toegang</p>
                  <p className="mt-1">`eva@monitoring.internal` / `ChangeMe!123`</p>
                </div>
              </div>
            </div>

            <FormLabel htmlFor="email" label="E-mail">
              <Input error={form.formState.errors.email?.message} id="email" {...form.register("email")} />
            </FormLabel>

            <FormLabel htmlFor="password" label="Wachtwoord">
              <Input
                error={form.formState.errors.password?.message}
                id="password"
                type="password"
                {...form.register("password")}
              />
            </FormLabel>

            {loginMutation.error ? (
              <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {loginMutation.error.message}
              </p>
            ) : null}

            <Button className="w-full" disabled={loginMutation.isPending} size="lg" type="submit">
              {loginMutation.isPending ? "Aanmelden..." : "Platform openen"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
