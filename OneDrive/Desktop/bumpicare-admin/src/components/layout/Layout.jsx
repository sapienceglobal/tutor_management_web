import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <Header />

        {/* Page Content Scrolls Here */}
        <main className="flex-1 overflow-y-auto p-6 hide-scrollbar">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
