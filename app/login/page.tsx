"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { DashboardErrorResponse, SessionUser } from "@/lib/types";

const formSchema = z.object({
  email: z.email("Should be valid email"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setServerError(null);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = (await response.json().catch(() => null)) as
          | Partial<DashboardErrorResponse>
          | null;
        setServerError(err?.message ?? "Authentication failed");
        return;
      }

      const payload = (await response.json()) as { user: SessionUser };
      setUser(payload.user);
      router.push("/");
      router.refresh();
    } catch {
      setServerError("Network error while signing in");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 md:py-12 gap-4">
      {user && (
        <div className="w-full max-w-md border border-border bg-card px-4 py-3 flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Active session:{" "}
            <span className="font-mono text-foreground">{user.email}</span>
          </span>
          <Button variant="outline" size="xs" render={<Link href="/" />}>
            Dashboard
          </Button>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to dashboard</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id="login-form" onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup>
              <div className="flex flex-col gap-5">
                {serverError && (
                  <div
                    role="alert"
                    className="border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                  >
                    {serverError}
                  </div>
                )}
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="login-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="operator@company.com"
                        autoComplete="email"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="login-password">Password</FieldLabel>
                      <Input
                        {...field}
                        id="login-password"
                        aria-invalid={fieldState.invalid}
                        placeholder=""
                        type="password"
                        autoComplete="current-password"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-2">
          <Button
            type="submit"
            className="w-full gap-2"
            form="login-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            <span>
              {form.formState.isSubmitting ? "Signing in..." : "Login"}
            </span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
