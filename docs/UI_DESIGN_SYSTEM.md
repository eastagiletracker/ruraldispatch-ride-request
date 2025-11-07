# Rural Dispatch - UI Design System

## Overview
This design system provides a comprehensive guide for building the Rural Dispatch ride-sharing application interface. It's built on **shadcn/ui** components and follows **mobile-first** responsive design principles.

---

## Design Principles

### 1. Mobile-First Approach
- Design for small screens first, then enhance for larger screens
- Touch-friendly interactive elements (min 44x44px)
- Clear visual hierarchy
- Simplified navigation

### 2. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios (min 4.5:1 for text)

### 3. Consistency
- Uniform spacing system
- Consistent component behavior
- Predictable user flows
- Standardized patterns

---

## Color System

### Primary Colors
- **Primary**: `hsl(221.2 83.2% 53.3%)` - #4F46E5 (Indigo)
  - Use for: Primary actions, links, active states
  - Accessible on white background

- **Primary Foreground**: `hsl(210 40% 98%)` - White text on primary

### Semantic Colors
- **Success**: `hsl(142 76% 36%)` - Green for positive actions
- **Warning**: `hsl(38 92% 50%)` - Amber for warnings
- **Destructive**: `hsl(0 84% 60%)` - Red for destructive actions
- **Info**: `hsl(199 89% 48%)` - Blue for information

### Neutral Colors
- **Background**: `hsl(0 0% 100%)` - Pure white
- **Foreground**: `hsl(222.2 84% 4.9%)` - Near black for text
- **Muted**: `hsl(210 40% 96.1%)` - Light gray backgrounds
- **Muted Foreground**: `hsl(215.4 16.3% 46.9%)` - Secondary text
- **Border**: `hsl(214.3 31.8% 91.4%)` - Subtle borders
- **Input**: `hsl(214.3 31.8% 91.4%)` - Form input borders

### Usage Guidelines
```jsx
// Primary button
<Button variant="default">Book Ride</Button>

// Success state
<Badge variant="default" className="bg-green-600">Confirmed</Badge>

// Destructive action
<Button variant="destructive">Cancel Ride</Button>

// Muted secondary content
<p className="text-muted-foreground">Last updated 5 mins ago</p>
```

---

## Typography

### Font Family
- **Primary**: System font stack via Tailwind
  - `font-sans`: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, etc.

### Type Scale
```jsx
// Page Title (H1)
<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
  Dashboard
</h1>

// Section Title (H2)
<h2 className="text-2xl md:text-3xl font-semibold">
  Active Rides
</h2>

// Subsection Title (H3)
<h3 className="text-xl md:text-2xl font-semibold">
  Ride Details
</h3>

// Card Title
<CardTitle className="text-lg font-semibold">
  Passenger Information
</CardTitle>

// Body Text
<p className="text-sm md:text-base leading-relaxed">
  Regular paragraph text
</p>

// Small Text
<span className="text-xs text-muted-foreground">
  Metadata or captions
</span>
```

### Font Weights
- **Regular**: 400 (body text)
- **Medium**: 500 (labels, emphasis)
- **Semibold**: 600 (headings, card titles)
- **Bold**: 700 (page titles)

---

## Spacing System

### Scale (based on Tailwind)
- **0**: 0px
- **1**: 4px (0.25rem) - `p-1`, `gap-1`
- **2**: 8px (0.5rem) - `p-2`, `gap-2`
- **3**: 12px (0.75rem) - `p-3`, `gap-3`
- **4**: 16px (1rem) - `p-4`, `gap-4` ⭐ Base unit
- **6**: 24px (1.5rem) - `p-6`, `gap-6`
- **8**: 32px (2rem) - `p-8`, `gap-8`
- **12**: 48px (3rem) - `p-12`, `gap-12`
- **16**: 64px (4rem) - `p-16`, `gap-16`

### Usage Guidelines
```jsx
// Page container
<div className="container mx-auto px-4 py-6 md:py-8">

// Card spacing
<Card className="p-4 md:p-6 space-y-4">

// Stack spacing (vertical)
<div className="flex flex-col gap-4">

// Grid spacing
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
```

---

## Component Library

### 1. Buttons

#### Primary Button
```jsx
<Button variant="default" size="default">
  Request Ride
</Button>
```
- Use for primary actions
- One per screen section
- Min width: 120px on mobile

#### Secondary Button
```jsx
<Button variant="secondary">
  View Details
</Button>
```
- Use for secondary actions
- Paired with primary buttons

#### Outline Button
```jsx
<Button variant="outline">
  Cancel
</Button>
```
- Use for tertiary actions
- Cancellation flows

#### Destructive Button
```jsx
<Button variant="destructive">
  Delete Ride
</Button>
```
- Use for destructive actions
- Always require confirmation

#### Icon Button
```jsx
<Button variant="ghost" size="icon">
  <Menu className="h-5 w-5" />
</Button>
```
- Use for icon-only actions
- Must have aria-label

#### Sizes
- `sm`: Small (mobile navigation)
- `default`: Standard (most actions)
- `lg`: Large (CTAs on mobile)
- `icon`: Square icon button

### 2. Cards

```jsx
<Card>
  <CardHeader>
    <CardTitle>Ride Request</CardTitle>
    <CardDescription>
      Requested for tomorrow at 9:00 AM
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Main content */}
  </CardContent>
  <CardFooter className="flex justify-between">
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </CardFooter>
</Card>
```

**Usage:**
- Container for related information
- Elevation via shadow
- Consistent padding

### 3. Tables

#### Mobile-First Table Pattern
```jsx
// Mobile: Card-based layout
<div className="md:hidden space-y-4">
  {items.map(item => (
    <Card key={item.id}>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="font-medium text-muted-foreground">Name:</div>
          <div>{item.name}</div>
          <div className="font-medium text-muted-foreground">Status:</div>
          <div><Badge>{item.status}</Badge></div>
        </div>
      </CardContent>
    </Card>
  ))}
</div>

// Desktop: Traditional table
<div className="hidden md:block">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map(item => (
        <TableRow key={item.id}>
          <TableCell>{item.name}</TableCell>
          <TableCell><Badge>{item.status}</Badge></TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### 4. Forms

```jsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="pickup">Pickup Location</Label>
    <Input
      id="pickup"
      placeholder="Enter address"
      required
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="time">Pickup Time</Label>
    <Input
      id="time"
      type="datetime-local"
      required
    />
  </div>

  <Button type="submit" className="w-full">
    Request Ride
  </Button>
</form>
```

**Guidelines:**
- Labels above inputs
- Clear error states
- Full-width on mobile
- Grouped related fields

### 5. Badges

```jsx
// Status badges
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">Scheduled</Badge>

// Custom colors
<Badge className="bg-green-600 text-white">Completed</Badge>
<Badge className="bg-amber-500 text-white">En Route</Badge>
```

### 6. Alerts

```jsx
<Alert>
  <CheckCircle className="h-4 w-4" />
  <AlertTitle>Success</AlertTitle>
  <AlertDescription>
    Your ride has been confirmed.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Unable to process request.
  </AlertDescription>
</Alert>
```

### 7. Dialogs/Modals

```jsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Assign Driver</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Assign Driver</DialogTitle>
      <DialogDescription>
        Select a driver for this ride request.
      </DialogDescription>
    </DialogHeader>
    {/* Form content */}
    <DialogFooter className="flex-col sm:flex-row gap-2">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={onAssign}>
        Assign
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## Layout Patterns

### 1. Page Layout
```jsx
<div className="min-h-screen flex flex-col">
  <Navbar />
  <main className="flex-1 container mx-auto px-4 py-6 md:py-8">
    {/* Page header */}
    <div className="mb-6 md:mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Dashboard
      </h1>
      <p className="text-muted-foreground">
        Manage your ride requests
      </p>
    </div>

    {/* Page content */}
    <div className="space-y-6">
      {/* Content sections */}
    </div>
  </main>
  <Footer />
</div>
```

### 2. Grid Layouts
```jsx
// Single column mobile, two columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

// Single column mobile, three columns desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Responsive with auto-fit
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
```

### 3. Sidebar Layout (Desktop)
```jsx
<div className="flex flex-col md:flex-row gap-6">
  {/* Sidebar - full width mobile, 1/4 desktop */}
  <aside className="w-full md:w-64 shrink-0">
    <Card>
      {/* Navigation or filters */}
    </Card>
  </aside>

  {/* Main content */}
  <main className="flex-1 min-w-0">
    {/* Content */}
  </main>
</div>
```

---

## Responsive Breakpoints

```js
// Tailwind breakpoints
{
  'sm': '640px',  // Small devices (landscape phones)
  'md': '768px',  // Medium devices (tablets)
  'lg': '1024px', // Large devices (desktops)
  'xl': '1280px', // Extra large devices
  '2xl': '1536px' // 2X extra large devices
}
```

**Usage:**
```jsx
// Mobile-first approach
<div className="text-sm md:text-base lg:text-lg">
<div className="p-4 md:p-6 lg:p-8">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## Icons

**Library:** Lucide React

**Common Icons:**
```jsx
import {
  Car,          // Ride/vehicle
  MapPin,       // Location
  Clock,        // Time
  User,         // User/passenger
  UserPlus,     // Add user
  Phone,        // Contact
  MessageSquare,// SMS/messaging
  CheckCircle,  // Success
  XCircle,      // Error
  AlertCircle,  // Warning
  Calendar,     // Date
  Menu,         // Menu/navigation
  X,            // Close
  ChevronRight, // Navigation arrow
  Search,       // Search
  Filter        // Filter
} from "lucide-react";
```

**Usage:**
```jsx
// In buttons
<Button>
  <Car className="h-4 w-4 mr-2" />
  Request Ride
</Button>

// Status indicators
<div className="flex items-center gap-2">
  <CheckCircle className="h-5 w-5 text-green-600" />
  <span>Ride Confirmed</span>
</div>
```

---

## Status System

### Ride Request Statuses
```jsx
const RIDE_STATUS = {
  PENDING: {
    value: 100,
    label: 'Pending',
    color: 'secondary',
    icon: Clock
  },
  DRIVER_ASSIGNED: {
    value: 400,
    label: 'Driver Assigned',
    color: 'default',
    icon: UserPlus
  },
  EN_ROUTE: {
    value: 500,
    label: 'En Route',
    color: 'bg-amber-500',
    icon: Car
  },
  IN_PROGRESS: {
    value: 600,
    label: 'In Progress',
    color: 'bg-blue-500',
    icon: MapPin
  },
  COMPLETED: {
    value: 700,
    label: 'Completed',
    color: 'bg-green-600',
    icon: CheckCircle
  },
  CANCELLED: {
    value: 800,
    label: 'Cancelled',
    color: 'destructive',
    icon: XCircle
  }
};

// Usage
<Badge variant={RIDE_STATUS.DRIVER_ASSIGNED.color}>
  {RIDE_STATUS.DRIVER_ASSIGNED.label}
</Badge>
```

---

## Accessibility Checklist

### Interactive Elements
- [ ] All buttons have clear labels
- [ ] Icon buttons have `aria-label`
- [ ] Links are distinguishable
- [ ] Focus states are visible

### Forms
- [ ] Labels associated with inputs
- [ ] Error messages announced
- [ ] Required fields marked
- [ ] Success feedback provided

### Color & Contrast
- [ ] Text contrast ≥ 4.5:1
- [ ] Interactive elements ≥ 3:1
- [ ] Don't rely on color alone

### Keyboard Navigation
- [ ] All actions keyboard accessible
- [ ] Logical tab order
- [ ] Escape closes modals
- [ ] Enter submits forms

---

## Mobile Optimization

### Touch Targets
```jsx
// Minimum 44x44px touch target
<Button size="default" className="min-h-[44px] min-w-[44px]">

// Increase spacing between clickable elements
<div className="flex gap-3">
```

### Mobile Navigation
```jsx
// Sticky bottom navigation (optional)
<nav className="fixed bottom-0 left-0 right-0 bg-background border-t p-2 flex justify-around md:hidden">
  <Button variant="ghost" size="sm">
    <Car className="h-5 w-5" />
  </Button>
  <Button variant="ghost" size="sm">
    <Calendar className="h-5 w-5" />
  </Button>
  <Button variant="ghost" size="sm">
    <User className="h-5 w-5" />
  </Button>
</nav>
```

### Viewport Considerations
```jsx
// Prevent horizontal scroll
<div className="max-w-full overflow-hidden">

// Full height sections
<section className="min-h-[calc(100vh-4rem)]">
```

---

## Code Examples

### Complete Page Example
```jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, MapPin } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Page Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage your ride requests and assignments
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Rides</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <Car className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        {/* More stat cards */}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Ride Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Content */}
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Performance Guidelines

1. **Lazy Load Images**
```jsx
<img loading="lazy" src={src} alt={alt} />
```

2. **Optimize Re-renders**
```jsx
// Use memo for expensive components
const RideCard = memo(({ ride }) => {
  // Component logic
});
```

3. **Debounce Search Inputs**
```jsx
const debouncedSearch = useDebouncedCallback((value) => {
  performSearch(value);
}, 300);
```

---

## Design Tokens Reference

```js
// Export for consistent usage
export const designTokens = {
  spacing: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  }
};
```

---

## Version History

- **v1.0.0** - Initial design system (January 2025)
  - shadcn/ui integration
  - Mobile-first approach
  - Complete component library
