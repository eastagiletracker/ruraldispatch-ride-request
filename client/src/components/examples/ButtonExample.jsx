import { Button } from "@/components/ui/button"

export default function ButtonExample() {
  return (
    <div className="flex flex-col gap-4 p-8">
      <h2 className="text-2xl font-bold">shadcn/ui Button Examples</h2>

      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Button size="sm">Small</Button>
        <Button size="default">Default</Button>
        <Button size="lg">Large</Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button disabled>Disabled</Button>
        <Button onClick={() => alert('Clicked!')}>With Click Handler</Button>
      </div>
    </div>
  )
}
