import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Map, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navigation() {
  const location = useLocation();

  const links = [
    { to: '/', icon: Home, label: 'الرئيسية' },
    { to: '/map', icon: Map, label: 'الخريطة' },
    { to: '/profile', icon: User, label: 'حسابي' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pt-2 pb-4">
      <div className="flex justify-around items-center h-14 relative">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative z-10 ${
                isActive ? 'text-nile-blue' : 'text-gray-400 hover:text-nile-blue-light'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="nav-bg"
                  className="absolute inset-0 bg-royal-gold/10 rounded-2xl mx-4 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.8 }}
                animate={{ y: isActive ? -2 : 0, scale: isActive ? 1.1 : 1, color: isActive ? '#D4AF37' : '#9CA3AF' }}
              >
                <Icon size={24} />
              </motion.div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-nile-blue' : ''}`}>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
