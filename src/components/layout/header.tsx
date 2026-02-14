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
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
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
      <header className="sticky top-0 z-40 hidden border-b border-[#EFEFEF] bg-background safe-top md:block">
        <div className="flex h-14 w-full items-center">
          <div className="flex flex-1 items-center justify-start pl-4 sm:pl-6">
            <Link
              href="/home"
              className="flex items-center"
              aria-label="PsiApp"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/icon"
                alt=""
                width={28}
                height={28}
                className="rounded-[20%]"
              />
            </Link>
          </div>

          <nav className="flex w-[62.5%] shrink-0 items-center px-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[15px] font-medium transition-colors",
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

          <div className="flex flex-1 items-center justify-end pr-4 sm:pr-6">
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
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EFEFEF] bg-background md:hidden py-2">
        <div className="flex h-[52px] w-full items-center px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
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
