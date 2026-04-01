"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Smart Scheduling",
    href: "/#features",
    description: "Automated booking and conflict resolution to maximize provider time.",
  },
  {
    title: "Queue Management",
    href: "/#features",
    description: "Priority-based waitlist with automatic provider assignment.",
  },
  {
    title: "Analytics Dashboard",
    href: "/#solution",
    description: "Real-time insights into provider utilization and clinic operations.",
  },
  {
    title: "RBAC System",
    href: "/#features",
    description: "Secure multi-role system with granular permissions.",
  },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-[72px] flex items-center justify-between">
        
        {/* Logo Section */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <Image 
                src="/logo.png" 
                alt="MediSync Logo" 
                width={36} 
                height={36} 
                className="object-contain"
                priority
              />
            </div>
            <span className="font-heading font-extrabold text-2xl text-primary hidden sm:inline-block tracking-tight group-hover:text-primary/80 transition-colors">
              MediSync
            </span>
          </Link>
        </div>

        {/* Desktop Navigation - Shadcn UI NavigationMenu */}
        <div className="hidden md:flex flex-1 justify-center">
          <NavigationMenu>
            <NavigationMenuList className="space-x-2">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent tracking-wide text-[15px]">Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-card border-slate-100">
                    {components.map((component) => (
                      <ListItem
                        key={component.title}
                        title={component.title}
                        href={component.href}
                      >
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/#solutions" className={cn(navigationMenuTriggerStyle(), "bg-transparent tracking-wide text-[15px]")}>
                  Solutions
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink href="/#technology" className={cn(navigationMenuTriggerStyle(), "bg-transparent tracking-wide text-[15px]")}>
                  Technology
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Action Buttons */}
        <div className="hidden md:flex items-center space-x-4">
          <Link href="https://github.com/rockychowdhury" target="_blank">
            <Button variant="ghost" className="hover:text-primary font-medium tracking-wide">
              GitHub
            </Button>
          </Link>
          <Link href="/login">
            <Button className="gradient-primary shadow-md hover:shadow-lg transition-all rounded-full px-6 tracking-wide font-medium bg-blue-600 hover:bg-blue-700 text-white border-none">
              View Live Demo
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <div className="md:hidden flex items-center">
          <Button variant="ghost" size="icon" aria-label="Toggle Menu" className="text-foreground">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink 
        href={href}
        className={cn(
          "block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          className
        )}
        {...(props as any)}
      >
        <div className="text-sm font-semibold leading-none text-primary">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground mt-2">
          {children}
        </p>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"
