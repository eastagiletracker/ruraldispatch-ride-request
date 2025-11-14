import Search from './Search';
import { fetchTopUserMatches } from "../utils/database";
import { formatShortId } from "@/utils/formatters";
import type { User } from "@/types";

interface UserSearchProps {
    onUserSelect: (user: User) => void;
}

export default function UserSearch({ onUserSelect }: UserSearchProps) {

    return (
        <Search<User>
            searchElementName="user"
            fetchMatchesFn={fetchTopUserMatches}
            renderElementFn={renderUser}
            placeHolderText="Start typing user name or ID"
        />
    )

    function renderUser(user: User, handleUserSelect: (user: User) => void): React.JSX.Element {
        return (
            <div
                key={user.uuid}
                onClick={() => {
                    handleUserSelect(user)
                    onUserSelect(user)
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
            >
                <div className="font-medium text-gray-900">{user.fullName}</div>
                <div className="text-sm text-gray-500">
                    ID: {formatShortId(user.uuid)} • Phone: {user.phone}
                </div>
            </div>
        )
    }
} 