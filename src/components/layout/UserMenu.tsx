import { useRef } from "react";
import { ChevronsUpDown, LogOut, Settings, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Props {
  name: string;
  email: string;
  role: string;
  initials: string;
}

export function UserMenu({ name, email, role, initials }: Props) {
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <>
      {/* Hidden form submitted programmatically from the Sign out menu item. */}
      <form ref={signOutForm} method="POST" action="/api/auth/signout" className="hidden" />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-(--color-border-soft) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--color-primary) cursor-pointer">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #ea580c, #c2410c)" }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-(--color-foreground)">{name}</p>
              <p className="truncate text-xs capitalize text-(--color-muted)">{role}</p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-(--color-muted)" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent side="top" align="start" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-semibold leading-none">{name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <a href="/profile" className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/settings" className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => {
              // Radix unmounts the menu item on click, which cancels a nested
              // submit button's native submit. Submit the form via its ref.
              e.preventDefault();
              signOutForm.current?.requestSubmit();
            }}
            className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
