"use client"

import { ChevronsUpDown, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useOrganizationList } from "@clerk/clerk-react"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()
  const { userMemberships, setActive, isLoaded } = useOrganizationList()

  if (!isLoaded || !userMemberships?.data) return null

  const organizationList = userMemberships.data
  const activeOrg = organizationList.find((org: any) => org?.role !== undefined)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg text-xs font-bold uppercase">
                {activeOrg?.organization.name?.charAt(0) || "?"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrg?.organization.name}
                </span>
                <span className="truncate text-xs capitalize">
                  {activeOrg?.role}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Your Organizations
            </DropdownMenuLabel>

            {organizationList.map((org: any) => (
              <DropdownMenuItem
                key={org.organization.id}
                onClick={() => setActive({ organization: org.organization.id })}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border text-xs font-bold uppercase">
                  {org.organization.name.charAt(0)}
                </div>
                {org.organization.name}
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => window.location.assign("/create-organization")}
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add organization</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
