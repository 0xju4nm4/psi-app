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
  Calendar,
  Users,
  Settings,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/home", label: "Agenda", icon: Calendar },
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
      <header className="sticky top-0 z-40 hidden border-b border-[#EFEFEF] bg-background safe-top shadow-[0_1px_6px_rgba(0,0,0,0.05)] md:block">
        <div className="relative flex h-14 w-full items-center">
          <div className="absolute left-4 sm:left-6 flex items-center">
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

          <nav className="mx-auto flex w-full items-center justify-between md:w-[62.5%] px-4 lg:px-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg py-2 text-[15px] font-medium transition-colors",
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

          <div className="absolute right-4 sm:right-6 flex items-center">
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
