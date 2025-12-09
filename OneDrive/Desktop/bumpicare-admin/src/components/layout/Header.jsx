import { Bell, User } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Header() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Left side - can add breadcrumbs or page title here */}
      <div className="flex items-center">
        <h2 className="text-lg font-semibold text-gray-800 hidden md:block">
          Welcome back, {user?.name}
        </h2>
      </div>

      {/* Right side - Notifications & Profile */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary-100 text-primary-700">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 
             shadow-lg rounded-xl p-2"
          >
            <DropdownMenuLabel className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 px-2 py-1">
              My Account
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              className="flex items-center px-3 py-2 rounded-md cursor-pointer 
               hover:bg-neutral-100 dark:hover:bg-neutral-800 
               focus:bg-neutral-100 dark:focus:bg-neutral-800 transition"
            >
              <User className="w-4 h-4 mr-2 text-neutral-600 dark:text-neutral-300" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center px-3 py-2 rounded-md cursor-pointer 
               text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40
               focus:bg-red-100 dark:focus:bg-red-900/40 transition"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </header>
  );
}