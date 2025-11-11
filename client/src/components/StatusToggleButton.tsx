import { Button } from "@/components/ui/button";
import { LoaderCircle } from "lucide-react";

interface StatusToggleButtonProps {
    isActive: boolean;
    isLoading?: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export default function StatusToggleButton({
    isActive,
    isLoading = false,
    onClick,
    disabled = false,
}: StatusToggleButtonProps) {
    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            disabled={disabled || isLoading}
            className="flex items-center gap-2"
        >
            {isLoading && (
                <LoaderCircle className="h-4 w-4 animate-spin" />
            )}
            {isActive ? 'Deactivate' : 'Activate'}
        </Button>
    );
}
