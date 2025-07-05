"use client"

import * as React from "react"
import { Link, useLocation } from "react-router-dom"
import { useUser, useOrganization, OrganizationSwitcher } from "@clerk/clerk-react"
import { ChevronLeft, ChevronRight, LayoutDashboard, Settings, Users, Home, Menu, Moon, Sun } from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import { toggleDarkMode } from "@/App"
import { useIsMobile } from "@/hooks/use-mobile"

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  current?: boolean
}

export const MOBILE_NAVBAR_HEIGHT = 64; // px, h-16

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser()
  const location = useLocation()
  const [isDark, setIsDark] = React.useState(() => document.documentElement.classList.contains('dark'));
  const isMobile = useIsMobile();

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      current: location.pathname === '/dashboard'
    },
    {
      name: 'Services',
      href: '/services/1',
      icon: Menu,
      current: location.pathname.startsWith('/services')
    }
  ]

  function handleToggleDarkMode() {
    toggleDarkMode();
    setIsDark(document.documentElement.classList.contains('dark'));
  }

  if (isMobile) {
    // Render a top navbar for mobile
    return (
      <nav className="fixed top-0 left-0 w-full h-16 z-50 bg-white dark:bg-zinc-900 border-b border-border/40 flex items-center px-2 sm:px-4 gap-2 shadow-sm">
        <div className="flex-1 flex items-center gap-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-start border border-border/40 bg-background/50 hover:bg-accent/50 px-2 py-1 rounded-md text-xs font-medium transition-colors !text-gray-900 dark:!text-zinc-100",
                organizationSwitcherTriggerIcon: "text-muted-foreground"
              }
            }}
          />
        </div>
        <div className="flex-1 flex justify-center gap-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex flex-col items-center px-2 py-1 rounded-md text-xs font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  item.current
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0 mb-0.5",
                  item.current ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="truncate">{item.name}</span>
              </Link>
            )
          })}
        </div>
        <div className="flex-1 flex justify-end items-center gap-2">
          <button
            onClick={handleToggleDarkMode}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <NavUser
            user={user ? {
              name: user.fullName || user.username || user.id,
              email: user.primaryEmailAddress?.emailAddress || '',
              avatar: user.imageUrl || ''
            } : { name: '', email: '', avatar: '' }}
          />
        </div>
      </nav>
    );
  }

  return (
    <Sidebar className={cn(
      "group/sidebar fixed left-0 top-0 h-screen z-40 border-r border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-64 transition-all duration-300 ease-in-out"
    )} {...props}>
      {/* Header */}
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center justify-between gap-2">
          <OrganizationSwitcher
            hidePersonal
            afterCreateOrganizationUrl="/dashboard"
            afterLeaveOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
            appearance={{
              elements: {
                rootBox: "w-full",
                organizationSwitcherTrigger: "w-full justify-start border border-border/40 bg-background/50 hover:bg-accent/50 px-3 py-2 rounded-md text-sm font-medium transition-colors !text-gray-900 dark:!text-zinc-100",
                organizationSwitcherTriggerIcon: "text-muted-foreground"
              }
            }}
          />
          <button
            onClick={handleToggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </SidebarHeader>

      {/* Navigation Content */}
      <SidebarContent className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-accent hover:text-accent-foreground",
                  item.current
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  item.current ? "text-accent-foreground" : "text-muted-foreground group-hover:text-foreground"
                )} />
                <span className="truncate">{item.name}</span>
                {item.current && (
                  <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-accent-foreground" />
                )}
              </Link>
            )
          })}
        </nav>
      </SidebarContent>

      {/* Footer */}
      <SidebarFooter className="border-t border-border/40 p-3 flex flex-col gap-3 items-center">
        <NavUser 
          user={user ? {
            name: user.fullName || user.username || user.id,
            email: user.primaryEmailAddress?.emailAddress || '',
            avatar: user.imageUrl || ''
          } : { name: '', email: '', avatar: '' }}
        />
      </SidebarFooter>
    </Sidebar>
  )
}