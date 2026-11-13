import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  FileText,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { PageHeader, TableSkeleton } from "@/components/page-shell";
import {
  AuthorityBadge,
  OperatorStatusBadge,
} from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getServerSession } from "@/lib/auth";
import type { OperatorAuthority } from "@/lib/types";

interface DashboardModule {
  title: string;
  href: string;
  authority: OperatorAuthority;
  description: string;
  icon: typeof FileText;
}

const MODULES: DashboardModule[] = [
  {
    title: "Documents",
    href: "/documents",
    authority: "METADATA",
    description:
      "Inspect indexed corpus documents, source systems, and sync timestamps.",
    icon: FileText,
  },
  {
    title: "Ingestion Logs",
    href: "/logs/ingestion",
    authority: "LOGS",
    description:
      "Track document fetch, parse, and vector storage pipeline runs and errors.",
    icon: Activity,
  },
  {
    title: "Generation Logs",
    href: "/logs/generation",
    authority: "LOGS",
    description:
      "Audit RAG query outcomes, confidence scores, and failure categories.",
    icon: Sparkles,
  },
  {
    title: "Users & ACLs",
    href: "/users",
    authority: "USERS",
    description:
      "Review user directory emails, group memberships, and ACL sync freshness.",
    icon: Users,
  },
  {
    title: "Operators",
    href: "/operators",
    authority: "OPERATORS",
    description:
      "Manage dashboard operators, inspect authorities, and toggle ACTIVE/BLOCKED.",
    icon: Shield,
  },
];

async function DashboardOverview() {
  const session = await getServerSession();
  if (!session.user) {
    redirect("/login");
  }

  const user = session.user;
  const granted = new Set(user.authorities);
  const availableModules = MODULES.filter((m) => granted.has(m.authority));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Control Plane"
        title="STAR Copilot Overview"
        description="Session context and authorized diagnostic modules."
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <CardTitle className="font-mono text-base">{user.email}</CardTitle>
          </div>
          <OperatorStatusBadge status={user.status} />
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 pt-0">
          <span className="text-xs text-muted-foreground mr-1">
            Granted authorities:
          </span>
          {user.authorities.length > 0 ? (
            user.authorities.map((auth) => (
              <AuthorityBadge key={auth} authority={auth} />
            ))
          ) : (
            <span className="text-xs font-mono text-muted-foreground">
              NONE
            </span>
          )}
        </CardContent>
      </Card>

      {availableModules.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Modules Assigned</CardTitle>
            <CardDescription>
              Your operator account currently has no dashboard authorities
              assigned. Contact an administrator with OPERATORS access.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableModules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.href}
                href={mod.href}
                className="group block focus:outline-none"
              >
                <Card className="h-full transition-colors group-hover:border-brand/70 group-focus-visible:border-ring">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className="size-4 text-brand" />
                      <AuthorityBadge authority={mod.authority} />
                    </div>
                    <CardTitle className="flex items-center justify-between pt-2">
                      <span>{mod.title}</span>
                      <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand" />
                    </CardTitle>
                    <CardDescription>{mod.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} />}>
      <DashboardOverview />
    </Suspense>
  );
}
