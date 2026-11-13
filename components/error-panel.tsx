import Link from "next/link";
import { AlertTriangle, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ErrorPanel({
  status,
  message,
}: {
  status: number;
  message: string;
}) {
  const isForbidden = status === 403;

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          {isForbidden ? (
            <ShieldOff className="size-4" />
          ) : (
            <AlertTriangle className="size-4" />
          )}
          <span>
            {isForbidden ? "Access Denied (403)" : `Request Failed (${status})`}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm text-muted-foreground">
        <p>{message}</p>
        <div>
          <Button variant="outline" size="sm" render={<Link href="/" />}>
            Back to overview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
