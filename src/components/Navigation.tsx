import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, User } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-4 z-50">
      <div className="flex justify-around items-center h-16">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-royal-gold' : 'text-gray-400 hover:text-nile-blue-light'
            }`
          }
        >
          <Home size={24} />
          <span className="text-xs font-semibold">الرئيسية</span>
        </NavLink>
        
        <NavLink
          to="/map"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-royal-gold' : 'text-gray-400 hover:text-nile-blue-light'
            }`
          }
        >
          <Map size={24} />
          <span className="text-xs font-semibold">الخريطة</span>
        </NavLink>
        
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full space-y-1 ${
              isActive ? 'text-royal-gold' : 'text-gray-400 hover:text-nile-blue-light'
            }`
          }
        >
          <User size={24} />
          <span className="text-xs font-semibold">حسابي</span>
        </NavLink>
      </div>
    </nav>
  );
}
