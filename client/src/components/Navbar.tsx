import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Car, LayoutDashboard, Plus, Building } from "lucide-react";

const Navbar = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/", label: "Create Ride Request", icon: Plus },
    { to: "/service-provider", label: "Create Service Provider", icon: Building },
    { to: "/vehicle", label: "Create Vehicle", icon: Car },
  ];

  return (
    <nav className="bg-white border-b shadow-sm">
      <div className="mx-auto container px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/App Name */}
          <Link to="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold text-foreground">
              Rural Dispatch
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Button
                  key={link.to}
                  asChild
                  variant={isActive(link.to) ? "default" : "outline"}
                  size="sm"
                  className={isActive(link.to) ? "" : "border-gray-300 hover:bg-gray-50"}
                >
                  <Link to={link.to} className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{link.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 