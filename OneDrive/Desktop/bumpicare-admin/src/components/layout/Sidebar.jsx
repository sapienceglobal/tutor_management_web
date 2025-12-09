import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/Maxxkart-Icon.png";  

import {
  Menu,
  X,
  ChevronRight,
  // LogOut,
} from "lucide-react";

import menuGroups from "@/config/menuGroups";
import useAuthStore from "@/store/authStore";



export default function Sidebar() {
  const location = useLocation();
  // const { logout } = useAuthStore();

  const [openMenus, setOpenMenus] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  // Auto expand the correct menu when navigating
  useEffect(() => {
    const updated = {};
    menuGroups.forEach((group) =>
      group.items.forEach((item) => {
        if (item.children) {
          const active = item.children.some(
            (child) => child.path === location.pathname
          );
          if (active) updated[item.label] = true;
        }
      })
    );
    setOpenMenus((prev) => ({ ...prev, ...updated }));
  }, [location.pathname]);

  const toggleMenu = (key) =>
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <>
      {/* Mobile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`lg:hidden fixed top-4 ${isOpen && "left-56"} left-4 z-50 p-2 bg-teal-600 text-white rounded-lg shadow-lg`}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-72 
          bg-gradient-to-b from-teal-950 to-teal-900 text-white
          shadow-xl transition-transform duration-300 
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
    

        {/* Logo Section - Style 4: Premium Gradient Shift */}
        <div className="h-20 flex items-center px-6 border-b border-teal-700/50 bg-gradient-to-r from-teal-800/40 to-teal-700/20 relative overflow-hidden group cursor-pointer hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/20 transition-all duration-500">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-400/10 to-cyan-500/0 animate-shimmer"></div>

          {/* Logo with breathing effect */}
          <div className="relative z-10 animate-breathe">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 blur-lg opacity-60 animate-pulse-glow"></div>
              <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-white via-teal-50 to-cyan-100 p-2 shadow-2xl border-2 border-white/20">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Text with slide + fade animation */}
          <div className="ml-4 relative z-10 transition-all duration-1000 ease-out animate-slide-in">
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-teal-100 to-white bg-clip-text text-transparent animate-gradient-x tracking-tight">
              MaxxKart
            </h1>
            <p className="text-xs text-teal-300 font-medium tracking-wide">Admin Portal</p>
          </div>

          {/* Corner accent dot */}
          {/* <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-teal-400 animate-ping"></div> */}
        </div>

       


        {/* Scroll Area */}
        <nav className="px-3 pt-4 overflow-y-auto hide-scrollbar h-[calc(100%-120px)]">

          {menuGroups.map((group) => (
            <div key={group.id} className="mb-5">
              {group.title && (
                <h4 className="text-xs font-semibold text-yellow-400 mb-2 tracking-wide flex items-center gap-2 px-2">
                  <group.icon size={14} /> {group.title}
                </h4>
              )}

              {group.items.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    {/* PARENT should NEVER be highlighted */}
                    <button
                      onClick={() => toggleMenu(item.label)}
                      className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm
                        hover:bg-teal-800/40 text-teal-100`}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon size={18} />
                        {item.label}
                      </div>

                      <ChevronRight
                        size={16}
                        className={`transition-transform ${openMenus[item.label] ? "rotate-90" : ""
                          }`}
                      />
                    </button>

                    {/* CHILDREN */}
                    <AnimatePresence>
                      {openMenus[item.label] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="ml-6 mt-1 border-l border-teal-700/40 pl-3 space-y-1"
                        >
                          {item.children.map((child) => (
                            <NavLink
                              key={child.path}
                              to={child.path}
                              end
                              className={({ isActive }) =>
                                `block py-1.5 text-sm rounded px-2 transition
    ${isActive
                                  ? "bg-teal-800 text-white font-semibold"
                                  : "text-teal-100 hover:bg-teal-800/40"
                                }`
                              }
                            >
                              {child.label}
                            </NavLink>

                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                      ${isActive
                        ? "bg-teal-700"
                        : "hover:bg-teal-800/40 text-teal-100"
                      }`
                    }
                  >
                    <item.icon size={18} /> {item.label}
                  </NavLink>
                )
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        {/* <div className="p-4 border-t border-teal-800/40 bg-teal-900/40">
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-600/20"
          >
            <LogOut size={18} /> Logout
          </button>
        </div> */}
      </aside>

      {/* Scrollbar styling */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { width: 6px; }
        .hide-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,.2); border-radius: 10px; }
        .hide-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,.3); }
      `}</style>
    </>
  );
}
