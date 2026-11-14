"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useSession();

  const authorities = new Set(user?.authorities ?? []);
  const canMetadata = authorities.has("METADATA");
  const canLogs = authorities.has("LOGS");
  const canUsers = authorities.has("USERS");
  const canOperators = authorities.has("OPERATORS");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground hover:text-brand transition-colors"
          >
            <span className="font-heading text-base tracking-normal">
              STAR Copilot
            </span>
          </Link>

          {user && (
            <NavigationMenu>
              <NavigationMenuList>
                {canMetadata && (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      active={pathname.startsWith("/documents")}
                      render={<Link href="/documents" />}
                    >
                      Documents
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {canLogs && (
                  <NavigationMenuItem>
                    <NavigationMenuTrigger
                      className={
                        pathname.startsWith("/logs")
                          ? "bg-muted text-foreground"
                          : undefined
                      }
                    >
                      Logs
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="min-w-44">
                      <ul className="grid gap-1">
                        <li>
                          <NavigationMenuLink
                            active={pathname.startsWith("/logs/ingestion")}
                            render={<Link href="/logs/ingestion" />}
                          >
                            <div>
                              <div className="font-medium">Ingestion</div>
                              <div className="text-xs text-muted-foreground">
                                Document sync jobs & failures
                              </div>
                            </div>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <NavigationMenuLink
                            active={pathname.startsWith("/logs/generation")}
                            render={<Link href="/logs/generation" />}
                          >
                            <div>
                              <div className="font-medium">Generation</div>
                              <div className="text-xs text-muted-foreground">
                                RAG query outcomes & scores
                              </div>
                            </div>
                          </NavigationMenuLink>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                )}

                {canUsers && (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      active={pathname.startsWith("/users")}
                      render={<Link href="/users" />}
                    >
                      Users
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}

                {canOperators && (
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      active={pathname.startsWith("/operators")}
                      render={<Link href="/operators" />}
                    >
                      Operators
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void logout()}
                className="gap-1.5"
              >
                <LogOut className="size-3.5" />
                <span>Logout</span>
              </Button>
          ) : (
            pathname !== "/login" && (
              <Button
                variant="default"
                size="sm"
                render={<Link href="/login" />}
              >
                Login
              </Button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
