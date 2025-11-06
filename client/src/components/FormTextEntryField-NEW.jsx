import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function FormTextEntryField({label, name, type, value, onChangeFn, placeholder = "Enter data", error}) {
    return (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChangeFn}
                placeholder={placeholder}
                className={error ? "border-destructive" : ""}
            />
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    )
}
