# shadcn/ui Migration Guide

## Step 1: Add shadcn/ui Components

Run these commands in your terminal:

```bash
cd /home/johan-desktop/dev/ride-request-mvp-johan/client

# Add all components at once
npx shadcn@latest add input label checkbox select textarea card badge dialog table separator scroll-area alert
```

Or add them one by one:
```bash
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add checkbox
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add alert
```

---

## Step 2: Component Replacement Guide

### 1. **FormTextEntryField** → Input + Label

**Before:**
```jsx
<FormTextEntryField
  label="Rider Name"
  name="riderName"
  type="text"
  value={formData.riderName}
  onChangeFn={handleInputChange}
/>
```

**After:**
```jsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="riderName">Rider Name</Label>
  <Input
    id="riderName"
    name="riderName"
    type="text"
    value={formData.riderName}
    onChange={handleInputChange}
  />
</div>
```

---

### 2. **Custom Buttons** → shadcn Button

**Before:**
```jsx
<button className="btn-primary">
  Submit
</button>

<button className="btn-secondary">
  Cancel
</button>
```

**After:**
```jsx
import { Button } from "@/components/ui/button"

<Button>Submit</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
```

---

### 3. **Cards/Containers** → Card Component

**Before:**
```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <h3 className="text-lg font-semibold">Ride Request</h3>
  <p>Content here...</p>
</div>
```

**After:**
```jsx
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Ride Request</CardTitle>
    <CardDescription>Create a new ride request</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Content here...</p>
  </CardContent>
  <CardFooter>
    <Button>Submit</Button>
  </CardFooter>
</Card>
```

---

### 4. **Checkboxes**

**Before:**
```jsx
<input
  type="checkbox"
  checked={formData.roundtrip}
  onChange={handleInputChange}
/>
```

**After:**
```jsx
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

<div className="flex items-center space-x-2">
  <Checkbox
    id="roundtrip"
    checked={formData.roundtrip}
    onCheckedChange={(checked) =>
      setFormData(prev => ({ ...prev, roundtrip: checked }))
    }
  />
  <Label htmlFor="roundtrip">Round Trip</Label>
</div>
```

---

### 5. **Select Dropdowns**

**Before:**
```jsx
<select
  name="rideRequestType"
  value={formData.rideRequestType}
  onChange={handleInputChange}
  className="w-full px-3 py-2 border rounded-md"
>
  <option value="Standard">Standard</option>
  <option value="Medical">Medical</option>
  <option value="Emergency">Emergency</option>
</select>
```

**After:**
```jsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label>Ride Request Type</Label>
  <Select
    value={formData.rideRequestType}
    onValueChange={(value) =>
      setFormData(prev => ({ ...prev, rideRequestType: value }))
    }
  >
    <SelectTrigger>
      <SelectValue placeholder="Select type" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="Standard">Standard</SelectItem>
      <SelectItem value="Medical">Medical</SelectItem>
      <SelectItem value="Emergency">Emergency</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### 6. **Status Badges**

**Before:**
```jsx
<span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
  Active
</span>
```

**After:**
```jsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Cancelled</Badge>
<Badge variant="outline">Completed</Badge>
```

---

### 7. **Dialogs/Modals**

**After:**
```jsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Assign Driver</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Assign Driver</DialogTitle>
      <DialogDescription>
        Select a driver for this ride request.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      {/* Dialog content */}
    </div>
    <DialogFooter>
      <Button type="submit">Assign</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### 8. **Tables**

**After:**
```jsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Rider</TableHead>
      <TableHead>Pickup</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {rides.map((ride) => (
      <TableRow key={ride.id}>
        <TableCell>{ride.riderName}</TableCell>
        <TableCell>{ride.pickupLocation}</TableCell>
        <TableCell>
          <Badge>{ride.status}</Badge>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### 9. **Textarea**

**Before:**
```jsx
<textarea
  name="notes"
  value={formData.notes}
  onChange={handleInputChange}
  className="w-full px-3 py-2 border rounded-md"
/>
```

**After:**
```jsx
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

<div className="space-y-2">
  <Label htmlFor="notes">Notes</Label>
  <Textarea
    id="notes"
    name="notes"
    value={formData.notes}
    onChange={handleInputChange}
    placeholder="Enter additional notes..."
  />
</div>
```

---

### 10. **Alerts/Notifications**

**After:**
```jsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Success!</AlertTitle>
  <AlertDescription>
    Ride request created successfully.
  </AlertDescription>
</Alert>

<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Failed to create ride request.
  </AlertDescription>
</Alert>
```

---

## Step 3: Updated Component Examples

I've created updated versions of your components in the `/client/src/components-new/` folder.

After installing the shadcn components, I can help you replace:

1. ✅ **FormTextEntryField** - Input + Label
2. ✅ **RideRequestForm** - Full form with shadcn components
3. ✅ **Navbar** - Navigation with better styling
4. ✅ **ActiveRides** - Table with Cards
5. ✅ **AssignDriver** - Dialog component
6. ✅ **SMSConversation** - Card + ScrollArea

---

## Benefits of shadcn/ui:

✅ **Consistent Design** - All components follow the same design system
✅ **Accessibility** - Built with Radix UI primitives (fully accessible)
✅ **Customizable** - Easy to modify with Tailwind classes
✅ **TypeScript Ready** - Full type safety (works with JS too)
✅ **Dark Mode** - Built-in dark mode support
✅ **No Bundle Size Impact** - Only includes components you use

---

## Next Steps:

1. Run the `npx shadcn@latest add` commands above
2. Let me know when done, and I'll update your components one by one
3. Or tell me which component you want to update first!
