import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { SessionProvider } from "next-auth/react";
import { ChatButton } from "@/components/chat/chat-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen flex-col overflow-hidden">
        <Header />
        <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-full min-w-0 px-4 py-5 pb-28 sm:px-6 md:w-[62.5%] md:pb-8 lg:px-8">
            {children}
          </div>
        </main>
        <ChatButton />
      </div>
    </SessionProvider>
  );
}
