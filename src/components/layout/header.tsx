"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Panel", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendario", icon: Calendar },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/settings", label: "Ajustes", icon: Settings },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <>
      {/* Desktop top header */}
      <header className="sticky top-0 z-40 hidden border-b border-border/50 glass-heavy md:block">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="mr-8 text-lg font-semibold tracking-tight"
          >
            PsiApp
          </Link>

          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="size-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full">
                <Avatar>
                  {session?.user?.image && (
                    <AvatarImage
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                    />
                  )}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 size-4" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 glass-heavy safe-bottom md:hidden">
        <div className="flex h-[52px] items-end justify-around px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-w-[64px] flex-col items-center gap-0.5 pb-1 pt-1.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon
                  className="size-6"
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
